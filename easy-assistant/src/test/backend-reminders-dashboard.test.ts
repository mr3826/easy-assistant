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
const phase6Url = pathToFileURL(join(serverDir, 'phase6.mjs')).href;
const phase7Url = pathToFileURL(join(serverDir, 'phase7.mjs')).href;

function runScenario() {
  const script = `
    const { DatabaseSync } = await import('node:sqlite');
    const { schemaSql } = await import(${JSON.stringify(schemaUrl)});
    const { createRepository } = await import(${JSON.stringify(repositoryUrl)});
    const { createPhase2Service } = await import(${JSON.stringify(phase2Url)});
    const { createPhase4Service } = await import(${JSON.stringify(phase4Url)});
    const { createPhase6Service } = await import(${JSON.stringify(phase6Url)});
    const { createPhase7Service } = await import(${JSON.stringify(phase7Url)});

    const db = new DatabaseSync(':memory:');
    db.exec(schemaSql);

    const repository = createRepository(db);
    const phase2 = createPhase2Service(repository);
    const phase4 = createPhase4Service(repository);
    const phase6 = createPhase6Service(repository, { phase2, phase4 });
    const phase7 = createPhase7Service(repository);
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
      name: 'Mina Rahman',
      phone: '+8801711111111',
      email: 'mina@example.com',
      sourceChannel: 'manual',
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
      id: 'conv-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      channelId: channel.id,
      customerId: customer.id,
      externalConversationId: 'wa-thread-1',
      state: 'ai_handled',
      lastMessageAt: null,
      assignedUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    const settings = phase6.updateAiSettings(scope, {
      settings: {
        reminderEnabled: true,
      },
    }).settings;

    const manualAppointment = phase2.createAppointment(scope, {
      customerId: customer.id,
      serviceId: service.id,
      staffId: staff.id,
      channelId: channel.id,
      startTime: '2030-01-10T10:00:00+06:00',
      endTime: '2030-01-10T10:30:00+06:00',
      status: 'confirmed',
      createdBy: 'manual',
    }).appointment;
    const manualSchedule = phase7.syncAppointmentReminder(scope, manualAppointment);
    const manualCancelled = phase2.deleteAppointment(scope, manualAppointment.id);
    phase7.syncAppointmentReminder(scope, manualCancelled.appointment);

    const followUpAppointment = phase2.createAppointment(scope, {
      customerId: customer.id,
      serviceId: service.id,
      staffId: staff.id,
      channelId: channel.id,
      startTime: '2030-01-11T11:00:00+06:00',
      endTime: '2030-01-11T11:30:00+06:00',
      status: 'confirmed',
      createdBy: 'manual',
    }).appointment;
    phase7.syncAppointmentReminder(scope, followUpAppointment);

    const aiBooking = phase6.runReceptionist(
      scope,
      {
        conversationId: conversation.id,
        message: 'Please book me a haircut for Saturday morning.',
        intent: 'book',
        toolCall: {
          type: 'createAppointment',
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          channelId: channel.id,
          conversationId: conversation.id,
          startTime: '2030-01-12T12:00:00+06:00',
          endTime: '2030-01-12T12:30:00+06:00',
          notes: 'Morning preference',
          intent: 'book',
        },
      },
      { actorUserId: 'user-1' },
    );
    const aiSync = phase7.syncAppointmentReminder(scope, aiBooking.appointment);

    const reminderList = phase7.listReminders(scope);
    const manualReminder = reminderList.items.find((reminder) => reminder.appointmentId === manualAppointment.id);
    const manualDeliveries = phase7.listReminderDeliveries(scope, manualReminder.id);
    const summary = phase7.getDashboardSummary(scope);

    console.log(JSON.stringify({
      routePaths: {
        dashboardSummary: ${JSON.stringify(API_ROUTES.dashboardSummary.path)},
        reminderDetail: ${JSON.stringify(API_ROUTES.reminderDetail.path)},
        reminders: ${JSON.stringify(API_ROUTES.reminders.path)},
        reminderDeliveries: ${JSON.stringify(API_ROUTES.reminderDeliveries.path)},
      },
      settingsReminderEnabled: settings.reminderEnabled,
      manualScheduleStatus: manualSchedule.reminder?.status ?? null,
      manualCancelledStatus: manualCancelled.appointment.status,
      manualReminderStatus: manualReminder.status,
      manualDeliveryStatuses: manualDeliveries.items.map((delivery) => delivery.status),
      aiAppointmentStatus: aiBooking.appointment.status,
      aiReminderStatus: aiSync.reminder?.status ?? null,
      reminderCount: reminderList.items.length,
      reminderStatuses: reminderList.items.map((reminder) => reminder.status).sort(),
      generatedAt: summary.generatedAt,
      summaryMetrics: summary.metrics,
      bookingTrend: summary.bookingTrend,
      appointmentsByDay: summary.appointmentsByDay,
      channelDistribution: summary.channelDistribution,
      channelBreakdown: summary.channelBreakdown,
      recentAppointments: summary.recentAppointments.map((appointment) => ({
        id: appointment.id,
        status: appointment.status,
        customerName: appointment.customerName,
        serviceName: appointment.serviceName,
        staffName: appointment.staffName,
        channelName: appointment.channelName,
      })),
    }));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim();

  return JSON.parse(output);
}

describe('backend reminders and dashboard summary', () => {
  it('keeps the reminder and dashboard routes aligned', () => {
    expect(API_ROUTES.dashboardSummary).toMatchObject({
      method: 'GET',
      path: '/api/dashboard/summary',
      authRequired: true,
    });
    expect(API_ROUTES.reminders).toMatchObject({
      method: 'GET',
      path: '/api/reminders',
      authRequired: true,
    });
    expect(API_ROUTES.reminderDetail).toMatchObject({
      method: 'GET',
      path: '/api/reminders/:reminderId',
      authRequired: true,
    });
    expect(API_ROUTES.reminderDeliveries).toMatchObject({
      method: 'GET',
      path: '/api/reminders/:reminderId/deliveries',
      authRequired: true,
    });
  });

  it('syncs reminder rows from confirmed appointments and returns a live dashboard summary', () => {
    const result = runScenario();

    expect(result.routePaths.dashboardSummary).toBe('/api/dashboard/summary');
    expect(result.settingsReminderEnabled).toBe(true);
    expect(result.manualScheduleStatus).toBe('scheduled');
    expect(result.manualCancelledStatus).toBe('cancelled');
    expect(result.manualReminderStatus).toBe('cancelled');
    expect([...result.manualDeliveryStatuses].sort()).toEqual(['cancelled', 'scheduled']);
    expect(result.aiAppointmentStatus).toBe('confirmed');
    expect(result.aiReminderStatus).toBe('scheduled');
    expect(result.reminderCount).toBe(3);
    expect(result.reminderStatuses).toEqual(['cancelled', 'scheduled', 'scheduled']);
    expect(result.summaryMetrics).toMatchObject({
      totalBookings: 3,
      appointmentsTotal: 3,
      appointmentsConfirmed: 2,
      appointmentsUpcoming: 2,
      appointmentsToday: 2,
      todayBookings: 2,
      newMessages: 0,
      conversationsTotal: 1,
      conversationsActive: 1,
      pendingReminders: 2,
      remindersTotal: 3,
      remindersScheduled: 2,
      remindersCancelled: 1,
      reminderDeliveriesTotal: 4,
      conversionRate: 66.7,
      revenue: 3000,
      currency: 'BDT',
    });
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.bookingTrend).toHaveLength(3);
    expect(result.bookingTrend[0]).toMatchObject({
      label: '2030-01-10',
      bookings: 1,
      completed: 0,
      cancelled: 1,
    });
    expect(result.appointmentsByDay).toHaveLength(3);
    expect(result.appointmentsByDay[0].date).toBe('2030-01-10');
    expect(result.channelDistribution).toHaveLength(1);
    expect(result.channelDistribution[0]).toMatchObject({
      name: 'WhatsApp',
      value: 3,
    });
    expect(result.channelBreakdown).toHaveLength(1);
    expect(result.channelBreakdown[0]).toMatchObject({
      channelName: 'WhatsApp',
      channelType: 'whatsapp',
      appointments: 3,
      conversations: 1,
      reminders: 3,
    });
    expect(result.recentAppointments[0]).toMatchObject({
      status: 'confirmed',
      customerName: 'Mina Rahman',
      serviceName: 'Consultation',
      staffName: 'Nadia',
      channelName: 'WhatsApp',
    });
  });
});
