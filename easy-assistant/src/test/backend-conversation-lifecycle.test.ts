import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { API_ROUTES } from '../server/api/contracts';

const testDir = dirname(fileURLToPath(import.meta.url));
const serverDir = join(testDir, '..', '..', 'server');
const schemaUrl = pathToFileURL(join(serverDir, 'schema.mjs')).href;
const repositoryUrl = pathToFileURL(join(serverDir, 'repository.mjs')).href;
const phase2Url = pathToFileURL(join(serverDir, 'phase2.mjs')).href;
const phase4Url = pathToFileURL(join(serverDir, 'phase4.mjs')).href;

function runScenario() {
  const script = `
    const { DatabaseSync } = await import('node:sqlite');
    const { schemaSql } = await import(${JSON.stringify(schemaUrl)});
    const { createRepository } = await import(${JSON.stringify(repositoryUrl)});
    const { createPhase2Service } = await import(${JSON.stringify(phase2Url)});
    const { createPhase4Service } = await import(${JSON.stringify(phase4Url)});

    const db = new DatabaseSync(':memory:');
    db.exec(schemaSql);

    const repository = createRepository(db);
    const phase2 = createPhase2Service(repository);
    const phase4 = createPhase4Service(repository);
    const now = Date.UTC(2026, 5, 11, 0, 0, 0);
    const scope = { organizationId: 'org-1', locationId: 'loc-1', timezone: 'UTC' };

    repository.createUser({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'hash',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    repository.createOrganization({
      id: 'org-1',
      name: 'Clinic One',
      slug: 'clinic-one',
      timezone: 'UTC',
      ownerUserId: 'user-1',
      createdAt: now,
      updatedAt: now,
    });
    repository.createLocation({
      id: 'loc-1',
      organizationId: 'org-1',
      name: 'Downtown',
      timezone: 'UTC',
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

    repository.createService({
      id: 'svc-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: 'Consultation',
      category: 'General',
      description: null,
      durationMinutes: 30,
      bufferMinutes: 0,
      price: 1500,
      currency: 'BDT',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    repository.createStaff({
      id: 'staff-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: 'Nadia',
      roleTitle: 'Coordinator',
      email: 'nadia@example.com',
      phone: null,
      avatarUrl: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    phase2.assignStaffService(scope, 'staff-1', { serviceId: 'svc-1' });
    const channel = repository.createChannel({
      id: 'channel-whatsapp',
      organizationId: 'org-1',
      locationId: 'loc-1',
      type: 'whatsapp',
      name: 'WhatsApp',
      externalAccountId: 'acct-1',
      externalPhoneNumberId: 'phone-1',
      displayPhoneNumber: '+8801000000000',
      encryptedAccessToken: null,
      verifyTokenHash: null,
      metadata: { provider: 'whatsapp' },
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const customer = phase2.createCustomer(scope, {
      name: 'Mina',
      phone: '+8801000000000',
      email: 'mina@example.com',
      sourceChannel: 'manual',
      consentStatus: 'unknown',
    });

    const conversation = repository.createConversation({
      id: 'conv-open-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      channelId: channel.id,
      customerId: customer.customer.id,
      externalConversationId: 'wa-thread-1',
      state: 'ai_handled',
      lastMessageAt: null,
      assignedUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    const createdAppointment = phase2.createAppointment(scope, {
      customerId: customer.customer.id,
      serviceId: 'svc-1',
      staffId: 'staff-1',
      channelId: channel.id,
      conversationId: conversation.id,
      startTime: '2026-06-11T09:00:00.000Z',
      endTime: '2026-06-11T09:30:00.000Z',
      status: 'confirmed',
      createdBy: 'manual',
    });

    const updatedAppointment = phase2.updateAppointment(scope, createdAppointment.appointment.id, {
      conversationId: conversation.id,
    });

    const takeover = phase4.takeoverConversation(scope, 'user-1', conversation.id);
    const sentMessage = phase4.sendMessage(scope, 'user-1', conversation.id, {
      body: 'I have taken over this conversation.',
      sender: 'human',
      direction: 'outbound',
    });
    const messageList = phase4.listMessages(scope, conversation.id);
    const closed = phase4.closeConversation(scope, conversation.id);

    const clearedAppointment = phase2.updateAppointment(scope, createdAppointment.appointment.id, {
      conversationId: null,
    });

    console.log(JSON.stringify({
      createdConversationId: createdAppointment.appointment.conversationId,
      updatedConversationId: updatedAppointment.appointment.conversationId,
      takeoverState: takeover.conversation.state,
      sentMessageBody: sentMessage.message.body,
      messageCount: messageList.items.length,
      closedState: closed.conversation.state,
      clearedConversationId: clearedAppointment.appointment.conversationId,
      appointmentStatus: updatedAppointment.appointment.status,
    }));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim();

  return JSON.parse(output);
}

describe('backend conversation lifecycle', () => {
  it('keeps the briefed takeover, close, messages, and channel routes aligned', () => {
    expect(API_ROUTES.conversations).toMatchObject({
      method: 'GET',
      path: '/api/conversations',
      authRequired: true,
    });
    expect(API_ROUTES.conversationDetail).toMatchObject({
      method: 'GET',
      path: '/api/conversations/:conversationId',
      authRequired: true,
    });
    expect(API_ROUTES.messages).toMatchObject({
      method: 'GET',
      path: '/api/conversations/:conversationId/messages',
      authRequired: true,
    });
    expect(API_ROUTES.sendMessage).toMatchObject({
      method: 'POST',
      path: '/api/conversations/:conversationId/messages',
      authRequired: true,
    });
    expect(API_ROUTES.takeoverConversation).toMatchObject({
      method: 'POST',
      path: '/api/conversations/:conversationId/takeover',
      authRequired: true,
    });
    expect(API_ROUTES.humanTakeover).toMatchObject({
      method: 'POST',
      path: '/api/conversations/:conversationId/human-takeover',
      authRequired: true,
    });
    expect(API_ROUTES.closeConversation).toMatchObject({
      method: 'POST',
      path: '/api/conversations/:conversationId/close',
      authRequired: true,
    });
    expect(API_ROUTES.channels).toMatchObject({
      method: 'GET',
      path: '/api/channels',
      authRequired: true,
    });
  });

  it('persists the conversation link through appointment create and update', () => {
    const result = runScenario();

    expect(result).toMatchObject({
      createdConversationId: 'conv-open-1',
      updatedConversationId: 'conv-open-1',
      takeoverState: 'human_handled',
      sentMessageBody: 'I have taken over this conversation.',
      messageCount: 1,
      closedState: 'closed',
      clearedConversationId: null,
      appointmentStatus: 'confirmed',
    });
  });
});
