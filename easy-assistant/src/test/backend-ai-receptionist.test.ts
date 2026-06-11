import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const serverDir = join(testDir, '..', '..', 'server');
const schemaUrl = pathToFileURL(join(serverDir, 'schema.mjs')).href;
const repositoryUrl = pathToFileURL(join(serverDir, 'repository.mjs')).href;
const phase2Url = pathToFileURL(join(serverDir, 'phase2.mjs')).href;
const phase4Url = pathToFileURL(join(serverDir, 'phase4.mjs')).href;
const phase6Url = pathToFileURL(join(serverDir, 'phase6.mjs')).href;

function runScenario() {
  const script = `
    const { DatabaseSync } = await import('node:sqlite');
    const { schemaSql } = await import(${JSON.stringify(schemaUrl)});
    const { createRepository } = await import(${JSON.stringify(repositoryUrl)});
    const { createPhase2Service } = await import(${JSON.stringify(phase2Url)});
    const { createPhase4Service } = await import(${JSON.stringify(phase4Url)});
    const { createPhase6Service } = await import(${JSON.stringify(phase6Url)});

    const db = new DatabaseSync(':memory:');
    db.exec(schemaSql);

    const repository = createRepository(db);
    const phase2 = createPhase2Service(repository);
    const phase4 = createPhase4Service(repository);
    const phase6 = createPhase6Service(repository, { phase2, phase4 });
    const scope = { organizationId: 'org-1', locationId: 'loc-1', timezone: 'Asia/Dhaka' };
    const now = Date.UTC(2026, 5, 11, 2, 0, 0);

    repository.createUser({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@example.com',
      passwordHash: 'hash',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    repository.createOrganization({
      id: 'org-1',
      name: 'Demo Clinic',
      slug: 'demo-clinic',
      timezone: 'Asia/Dhaka',
      ownerUserId: 'user-1',
      createdAt: now,
      updatedAt: now,
    });
    repository.createLocation({
      id: 'loc-1',
      organizationId: 'org-1',
      name: 'Main',
      timezone: 'Asia/Dhaka',
      addressLine1: null,
      addressLine2: null,
      city: null,
      region: null,
      country: null,
      phone: null,
      active: true,
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

    const service = phase2.createService(scope, {
      name: 'Consultation',
      category: 'General',
      description: 'Initial consultation',
      durationMinutes: 30,
      bufferMinutes: 0,
      price: 1500,
      currency: 'BDT',
      active: true,
    }).service;

    const staff = phase2.createStaff(scope, {
      name: 'Nadia',
      roleTitle: 'Coordinator',
      email: 'nadia@example.com',
      phone: '+8801700000000',
      active: true,
    }).staff;

    phase2.assignStaffService(scope, staff.id, { serviceId: service.id });
    phase2.replaceAvailabilityBusinessHours(scope, {
      hours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        openTime: '09:00',
        closeTime: '17:00',
        active: true,
      })),
    });
    phase2.replaceStaffHours(scope, staff.id, {
      hours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        startTime: '09:00',
        endTime: '17:00',
        active: true,
      })),
    });

    const customer = phase2.createCustomer(scope, {
      name: 'Mina',
      phone: '+8801711111111',
      email: 'mina@example.com',
      sourceChannel: 'whatsapp',
      consentStatus: 'opted_in',
    }).customer;

    const channel = repository.createChannel({
      id: 'channel-1',
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

    const conversation = repository.createConversation({
      id: 'conv-ai-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      channelId: channel.id,
      customerId: customer.id,
      externalConversationId: 'wa-thread-ai-1',
      state: 'ai_handled',
      lastMessageAt: null,
      assignedUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    const initialSettings = phase6.getAiSettings(scope).settings;
    const updatedSettings = phase6.updateAiSettings(scope, {
      settings: {
        assistantName: 'Mina AI',
        tone: 'professional',
        defaultLanguage: 'bn',
        greetingMessage: 'Assalamu alaikum! How can I help with your booking?',
        humanHandoffMessage: 'A human team member will take it from here.',
        autoConfirmBookings: false,
        reminderEnabled: true,
      },
    }).settings;
    const persistedSettings = phase6.getAiSettings(scope).settings;

    const booking = phase6.runReceptionist(
      scope,
      {
        conversationId: conversation.id,
        message: 'Please book a consultation for tomorrow morning.',
        intent: 'book',
        toolCall: {
          type: 'createAppointment',
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          channelId: channel.id,
          conversationId: conversation.id,
          startTime: '2026-06-12T10:00:00+06:00',
          endTime: '2026-06-12T10:30:00+06:00',
          notes: 'Morning preference',
          intent: 'book',
        },
      },
      { actorUserId: 'user-1' },
    );

    const appointment = repository.findAppointmentById(booking.appointment.id);
    const auditLogs = repository.listAuditLogs(scope);
    const messages = phase4.listMessages(scope, conversation.id).items;
    const messageMetadata = messages[0] ? messages[0].metadata : null;
    const auditMetadata = auditLogs[0] ? JSON.parse(auditLogs[0].metadata) : null;

    console.log(JSON.stringify({
      initialAssistantName: initialSettings.assistantName,
      updatedAssistantName: updatedSettings.assistantName,
      persistedAssistantName: persistedSettings.assistantName,
      persistedTone: persistedSettings.tone,
      persistedReminderEnabled: persistedSettings.reminderEnabled,
      settingsIdStable: initialSettings.id === updatedSettings.id && updatedSettings.id === persistedSettings.id,
      assistantMessage: booking.assistantMessage,
      bookingAppointmentStatus: booking.appointment.status,
      bookingAppointmentCreatedBy: booking.appointment.createdBy,
      appointmentStatus: appointment.status,
      appointmentCreatedBy: appointment.created_by,
      appointmentChannelId: appointment.channel_id,
      appointmentConversationId: appointment.conversation_id,
      appointmentNotes: appointment.notes,
      auditLogCount: auditLogs.length,
      auditLogAction: auditLogs[0]?.action,
      auditLogEntityType: auditLogs[0]?.entity_type,
      auditLogActorUserId: auditLogs[0]?.actor_user_id,
      auditLogMetadataIntent: auditMetadata?.intent,
      auditLogToolCallType: auditMetadata?.toolCall?.type,
      messageCount: messages.length,
      replyBody: messages[0]?.body,
      replySender: messages[0]?.sender,
      replyDirection: messages[0]?.direction,
      replyTransport: messageMetadata?.transport,
      replyDeliveryStatus: messageMetadata?.deliveryStatus,
      replySettingsIdMatches: messageMetadata?.aiSettingsId === persistedSettings.id,
      conversationState: booking.conversation.state,
      conversationAssignedUserId: booking.conversation.assignedUserId,
      responseSettingsAssistantName: booking.settings.assistantName,
      responseMessageCreated: Boolean(booking.message),
    }));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim();

  return JSON.parse(output);
}

describe('backend AI receptionist workflow', () => {
  it('persists AI settings updates and runs the booking tool-call path end to end', () => {
    const result = runScenario();

    expect(result).toMatchObject({
      initialAssistantName: 'Easy Assistant',
      updatedAssistantName: 'Mina AI',
      persistedAssistantName: 'Mina AI',
      persistedTone: 'professional',
      persistedReminderEnabled: true,
      settingsIdStable: true,
      bookingAppointmentStatus: 'pending',
      bookingAppointmentCreatedBy: 'ai',
      appointmentStatus: 'pending',
      appointmentCreatedBy: 'ai',
      appointmentChannelId: 'channel-1',
      appointmentConversationId: 'conv-ai-1',
      appointmentNotes: 'Morning preference',
      auditLogCount: 1,
      auditLogAction: 'ai_receptionist.create_appointment',
      auditLogEntityType: 'appointment',
      auditLogActorUserId: 'user-1',
      auditLogMetadataIntent: 'book',
      auditLogToolCallType: 'createAppointment',
      messageCount: 1,
      replySender: 'ai',
      replyDirection: 'outbound',
      replyTransport: 'whatsapp',
      replyDeliveryStatus: 'queued',
      replySettingsIdMatches: true,
      conversationState: 'ai_handled',
      conversationAssignedUserId: null,
      responseSettingsAssistantName: 'Mina AI',
      responseMessageCreated: true,
    });
    expect(result.assistantMessage).toContain('Mina AI:');
    expect(result.replyBody).toBe(result.assistantMessage);
  });
});
