import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { API_ROUTES } from '../server/api/contracts';

const testDir = dirname(fileURLToPath(import.meta.url));
const serverDir = join(testDir, '..', '..', 'server');
const schemaUrl = pathToFileURL(join(serverDir, 'schema.mjs')).href;
const repositoryUrl = pathToFileURL(join(serverDir, 'repository.mjs')).href;
const phase4Url = pathToFileURL(join(serverDir, 'phase4.mjs')).href;
const phase5Url = pathToFileURL(join(serverDir, 'phase5.mjs')).href;

function runScenario() {
  const script = `
    const { DatabaseSync } = await import('node:sqlite');
    const { schemaSql } = await import(${JSON.stringify(schemaUrl)});
    const { createRepository } = await import(${JSON.stringify(repositoryUrl)});
    const { createPhase4Service } = await import(${JSON.stringify(phase4Url)});
    const { createPhase5Service } = await import(${JSON.stringify(phase5Url)});

    const db = new DatabaseSync(':memory:');
    db.exec(schemaSql);

    const repository = createRepository(db);
    const phase4 = createPhase4Service(repository);
    const phase5 = createPhase5Service(repository, { credentialSecret: 'test-whatsapp-secret' });
    const now = Date.UTC(2026, 5, 11, 0, 0, 0);
    const scope = { organizationId: 'org-1', locationId: 'loc-1', timezone: 'Asia/Dhaka' };

    repository.createUser({
      id: 'user-1',
      name: 'Ava',
      email: 'ava@example.com',
      passwordHash: 'hash',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    repository.createOrganization({
      id: 'org-1',
      name: 'Salon One',
      slug: 'salon-one',
      timezone: 'Asia/Dhaka',
      ownerUserId: 'user-1',
      createdAt: now,
      updatedAt: now,
    });
    repository.createLocation({
      id: 'loc-1',
      organizationId: 'org-1',
      name: 'Downtown',
      timezone: 'Asia/Dhaka',
      createdAt: now,
      updatedAt: now,
    });
    repository.createMembership({
      id: 'mem-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: 'owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const channel = repository.createChannel({
      id: 'channel-default',
      organizationId: 'org-1',
      locationId: 'loc-1',
      type: 'manual',
      name: 'Default inbox',
      externalAccountId: null,
      externalPhoneNumberId: null,
      displayPhoneNumber: null,
      encryptedAccessToken: null,
      verifyTokenHash: null,
      metadata: { seeded: true },
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const configuredChannel = phase5.updateChannel(scope, channel.id, {
      type: 'whatsapp',
      name: 'WhatsApp Business Cloud API',
      externalAccountId: 'acct-1',
      externalPhoneNumberId: 'phone-1',
      displayPhoneNumber: '+8801000000000',
      accessToken: 'plain-access-token',
      verifyToken: 'verify-secret',
      metadata: { provider: 'meta', seed: 'phase5' },
    }).channel;

    const verification = phase5.verifyWebhook({
      verifyToken: 'verify-secret',
      challenge: 'challenge-123',
    });

    const inbound = phase5.ingestWebhook({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba-1',
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: 'phone-1' },
                contacts: [
                  {
                    wa_id: '+8801711111111',
                    profile: { name: 'Nadia Rahman' },
                  },
                ],
                messages: [
                  {
                    id: 'wamid.inbound.1',
                    from: '+8801711111111',
                    timestamp: '1718064000',
                    type: 'text',
                    text: { body: 'Hello, I need an appointment' },
                    conversation: { id: 'wa-thread-1' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const customer = repository.findCustomerByPhone(scope, '+8801711111111');
    const conversation = repository.findConversationByChannelAndExternalConversationId(configuredChannel.id, 'wa-thread-1');
    const reply = phase4.sendMessage(scope, 'user-1', conversation.id, {
      body: 'Thanks for reaching out. I can help with that.',
      sender: 'human',
      direction: 'outbound',
    });

    const optOut = phase5.ingestWebhook({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'waba-1',
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: 'phone-1' },
                contacts: [
                  {
                    wa_id: '+8801711111111',
                    profile: { name: 'Nadia Rahman' },
                  },
                ],
                messages: [
                  {
                    id: 'wamid.inbound.2',
                    from: '+8801711111111',
                    timestamp: '1718064300',
                    type: 'text',
                    text: { body: 'STOP' },
                    conversation: { id: 'wa-thread-1' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    let blockedMessage = null;
    let blockedCode = null;
    try {
      phase4.sendMessage(scope, 'user-1', conversation.id, {
        body: 'Are you still there?',
        sender: 'human',
        direction: 'outbound',
      });
    } catch (error) {
      blockedMessage = error.message;
      blockedCode = error.code;
    }

    console.log(JSON.stringify({
      configuredType: configuredChannel.type,
      encryptedTokenStored: Boolean(repository.findChannelById(channel.id).encrypted_access_token),
      verifyHashStored: Boolean(repository.findChannelById(channel.id).verify_token_hash),
      verificationChallenge: verification.challenge,
      inboundProcessed: inbound.processed,
      inboundMessageBody: inbound.items[0].message.body,
      inboundCustomerConsent: customer.consent_status,
      replyDeliveryStatus: reply.message.metadata.deliveryStatus,
      replyTransport: reply.message.metadata.transport,
      optOutProcessed: optOut.processed,
      postOptOutConsent: repository.findCustomerByPhone(scope, '+8801711111111').consent_status,
      blockedMessage,
      blockedCode,
      messageCount: repository.listMessages(scope, conversation.id).length,
    }));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim();

  return JSON.parse(output);
}

describe('backend WhatsApp integration', () => {
  it('keeps the WhatsApp route metadata aligned with the backend contract surface', () => {
    expect(API_ROUTES.channelDetail).toMatchObject({
      method: 'GET',
      path: '/api/channels/:channelId',
      authRequired: true,
    });
    expect(API_ROUTES.updateChannel).toMatchObject({
      method: 'PATCH',
      path: '/api/channels/:channelId',
      authRequired: true,
    });
    expect(API_ROUTES.whatsappWebhookVerify).toMatchObject({
      method: 'GET',
      path: '/api/webhooks/whatsapp',
      authRequired: false,
    });
    expect(API_ROUTES.whatsappWebhookReceive).toMatchObject({
      method: 'POST',
      path: '/api/webhooks/whatsapp',
      authRequired: false,
    });
  });

  it('stores channel credentials securely, verifies the webhook, ingests inbound messages, and blocks outbound replies after opt-out', () => {
    const result = runScenario();

    expect(result).toMatchObject({
      configuredType: 'whatsapp',
      encryptedTokenStored: true,
      verifyHashStored: true,
      verificationChallenge: 'challenge-123',
      inboundProcessed: 1,
      inboundMessageBody: 'Hello, I need an appointment',
      inboundCustomerConsent: 'opted_in',
      replyDeliveryStatus: 'queued',
      replyTransport: 'whatsapp',
      optOutProcessed: 1,
      postOptOutConsent: 'opted_out',
      blockedCode: 'customer_opted_out',
      messageCount: 3,
    });
    expect(result.blockedMessage).toContain('opted out');
  });
});
