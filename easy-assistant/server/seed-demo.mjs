import { config } from './config.mjs';
import { openDatabase, withTransaction } from './db.mjs';
import { createRepository } from './repository.mjs';
import { createPhase2Service } from './phase2.mjs';
import { createPhase7Service } from './phase7.mjs';
import { hashPassword, hashText } from './crypto.mjs';
import { serializeAppointment } from './serializers.mjs';

const DEMO = {
  organization: {
    id: 'demo-org-easy-assistant-clinic',
    name: 'Easy Assistant Demo Clinic',
    slug: 'easy-assistant-demo-clinic',
  },
  location: {
    id: 'demo-location-main',
    name: 'Main Location',
  },
  owner: {
    id: 'demo-user-owner',
    name: 'Demo Owner',
    email: 'demo@easyassistant.local',
    password: 'demo12345',
  },
  manualChannel: {
    id: 'demo-channel-manual',
    name: 'Manual Inbox',
  },
  whatsappChannel: {
    id: 'demo-channel-whatsapp',
    name: 'WhatsApp Inbox',
    displayPhoneNumber: '+880 1700 555 120',
    externalAccountId: 'demo-whatsapp-account',
    externalPhoneNumberId: 'demo-whatsapp-phone-number',
    verifyToken: 'easy-assistant-demo-verify',
  },
  customer: {
    id: 'demo-customer-1',
    name: 'Sadia Khan',
    phone: '+880 1812 345 678',
    email: 'sadia@example.test',
  },
  services: [
    {
      id: 'demo-service-consultation',
      name: 'New Patient Consultation',
      category: 'Consultation',
      description: 'A first visit to review needs and plan treatment.',
      durationMinutes: 30,
      bufferMinutes: 10,
      price: 600,
    },
    {
      id: 'demo-service-scaling',
      name: 'Scaling & Polish',
      category: 'Treatment',
      description: 'A standard cleaning session with a finishing polish.',
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 1800,
    },
  ],
  staff: [
    {
      id: 'demo-staff-nadia',
      name: 'Dr. Nadia Rahman',
      roleTitle: 'Lead Dentist',
      email: 'nadia@example.test',
      phone: '+880 1701 000 101',
    },
    {
      id: 'demo-staff-arif',
      name: 'Arif Hossain',
      roleTitle: 'Treatment Coordinator',
      email: 'arif@example.test',
      phone: '+880 1701 000 102',
    },
  ],
  conversation: {
    id: 'demo-conversation-1',
    externalConversationId: 'wa-demo-conversation-001',
    inboundMessageId: 'demo-message-inbound',
    outboundMessageId: 'demo-message-outbound',
  },
  appointment: {
    id: 'demo-appointment-confirmed',
  },
};

const BUSINESS_HOURS = [
  { weekday: 1, openTime: '09:00', closeTime: '18:00' },
  { weekday: 2, openTime: '09:00', closeTime: '18:00' },
  { weekday: 3, openTime: '09:00', closeTime: '18:00' },
  { weekday: 4, openTime: '09:00', closeTime: '18:00' },
  { weekday: 5, openTime: '09:00', closeTime: '18:00' },
  { weekday: 6, openTime: '10:00', closeTime: '14:00' },
];

const STAFF_HOURS = {
  [DEMO.staff[0].id]: [
    { weekday: 1, startTime: '09:00', endTime: '13:00' },
    { weekday: 2, startTime: '09:00', endTime: '13:00' },
    { weekday: 3, startTime: '09:00', endTime: '13:00' },
    { weekday: 4, startTime: '09:00', endTime: '13:00' },
    { weekday: 5, startTime: '09:00', endTime: '13:00' },
  ],
  [DEMO.staff[1].id]: [
    { weekday: 1, startTime: '13:00', endTime: '18:00' },
    { weekday: 2, startTime: '13:00', endTime: '18:00' },
    { weekday: 3, startTime: '13:00', endTime: '18:00' },
    { weekday: 4, startTime: '13:00', endTime: '18:00' },
    { weekday: 5, startTime: '13:00', endTime: '18:00' },
  ],
};

async function main() {
  const db = openDatabase();
  const repository = createRepository(db);
  const phase2 = createPhase2Service(repository);
  const phase7 = createPhase7Service(repository);
  let seededAppointment = null;
  let scope = null;

  if (findOrganizationBySlug(db, DEMO.organization.slug) || repository.findUserByEmail(DEMO.owner.email)) {
    console.log(`[demo-seed] Demo tenant already exists: ${DEMO.organization.name}`);
    return;
  }

  withTransaction(db, () => {
    const now = Date.now();
    const owner = repository.createUser({
      id: DEMO.owner.id,
      name: DEMO.owner.name,
      email: DEMO.owner.email,
      passwordHash: hashPassword(DEMO.owner.password),
      status: 'active',
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const organization = repository.createOrganization({
      id: DEMO.organization.id,
      name: DEMO.organization.name,
      slug: DEMO.organization.slug,
      timezone: config.defaultTimezone,
      ownerUserId: owner.id,
      createdAt: now,
      updatedAt: now,
    });

    const location = repository.createLocation({
      id: DEMO.location.id,
      organizationId: organization.id,
      name: DEMO.location.name,
      timezone: config.defaultTimezone,
      addressLine1: 'House 18, Road 8, Dhanmondi',
      addressLine2: '2nd Floor',
      city: 'Dhaka',
      region: 'Dhaka',
      country: 'Bangladesh',
      phone: '+880 1700 555 120',
      createdAt: now,
      updatedAt: now,
    });

    scope = {
      organizationId: organization.id,
      locationId: location.id,
      timezone: location.timezone ?? organization.timezone ?? config.defaultTimezone,
    };

    repository.createMembership({
      id: 'demo-membership-owner',
      organizationId: organization.id,
      userId: owner.id,
      role: 'owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    repository.ensureDefaultChannel(scope, { createdAt: now, updatedAt: now }, { name: DEMO.manualChannel.name });
    repository.createChannel({
      id: DEMO.whatsappChannel.id,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      type: 'whatsapp',
      name: DEMO.whatsappChannel.name,
      externalAccountId: DEMO.whatsappChannel.externalAccountId,
      externalPhoneNumberId: DEMO.whatsappChannel.externalPhoneNumberId,
      displayPhoneNumber: DEMO.whatsappChannel.displayPhoneNumber,
      verifyTokenHash: hashText(DEMO.whatsappChannel.verifyToken),
      metadata: { seeded: true, source: 'demo-seed' },
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    for (const service of DEMO.services) {
      repository.createService({
        id: service.id,
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        price: service.price,
        currency: 'BDT',
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const staff of DEMO.staff) {
      repository.createStaff({
        id: staff.id,
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        name: staff.name,
        roleTitle: staff.roleTitle,
        email: staff.email,
        phone: staff.phone,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const staff of DEMO.staff) {
      for (const service of DEMO.services) {
        repository.upsertStaffService({
          id: `${staff.id}-${service.id}`,
          organizationId: scope.organizationId,
          locationId: scope.locationId,
          staffId: staff.id,
          serviceId: service.id,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    phase2.replaceAvailabilityBusinessHours(
      scope,
      {
        hours: BUSINESS_HOURS.map((hour) => ({
          weekday: hour.weekday,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          active: true,
        })),
      },
    );

    for (const staff of DEMO.staff) {
      phase2.replaceStaffHours(
        scope,
        staff.id,
        {
          hours: STAFF_HOURS[staff.id].map((hour) => ({
            weekday: hour.weekday,
            startTime: hour.startTime,
            endTime: hour.endTime,
            active: true,
          })),
        },
      );
    }

    repository.createCustomer({
      id: DEMO.customer.id,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      name: DEMO.customer.name,
      phone: DEMO.customer.phone,
      email: DEMO.customer.email,
      sourceChannel: 'whatsapp',
      consentStatus: 'opted_in',
      lastSeenAt: now,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    repository.createConversation({
      id: DEMO.conversation.id,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      channelId: DEMO.whatsappChannel.id,
      customerId: DEMO.customer.id,
      externalConversationId: DEMO.conversation.externalConversationId,
      state: 'human_handled',
      lastMessageAt: now,
      assignedUserId: owner.id,
      createdAt: now,
      updatedAt: now,
    });

    repository.createMessage({
      id: DEMO.conversation.inboundMessageId,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      conversationId: DEMO.conversation.id,
      sender: 'customer',
      direction: 'inbound',
      body: 'Hi, I would like to book a cleaning for tomorrow morning.',
      externalMessageId: 'wa-inbound-demo-001',
      sentAt: now - 2 * 60 * 60 * 1000,
      metadata: { seeded: true, source: 'demo-seed' },
      createdAt: now - 2 * 60 * 60 * 1000,
      updatedAt: now - 2 * 60 * 60 * 1000,
    });

    repository.createMessage({
      id: DEMO.conversation.outboundMessageId,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      conversationId: DEMO.conversation.id,
      sender: 'human',
      direction: 'outbound',
      body: 'Absolutely. I can hold a slot tomorrow at 10:30 AM for you.',
      externalMessageId: 'wa-outbound-demo-001',
      sentAt: now - 90 * 60 * 1000,
      metadata: { seeded: true, source: 'demo-seed', transport: 'whatsapp' },
      createdAt: now - 90 * 60 * 1000,
      updatedAt: now - 90 * 60 * 1000,
    });

    const appointmentStart = shiftAndSetHours(1, 10, 30);
    const appointmentEnd = new Date(appointmentStart.getTime() + 45 * 60 * 1000);
    const appointment = serializeAppointment(repository.createAppointment({
      id: DEMO.appointment.id,
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      customerId: DEMO.customer.id,
      serviceId: DEMO.services[1].id,
      staffId: DEMO.staff[0].id,
      channelId: DEMO.whatsappChannel.id,
      conversationId: DEMO.conversation.id,
      startTime: appointmentStart.getTime(),
      endTime: appointmentEnd.getTime(),
      status: 'confirmed',
      notes: 'Demo booking seeded for the dashboard.',
      createdBy: 'manual',
      createdAt: now,
      updatedAt: now,
    }));

    ensureAiSettings(repository, scope, now);
    seededAppointment = appointment;
  });

  if (seededAppointment && scope) {
    phase7.syncAppointmentReminder(scope, seededAppointment);
  }

  console.log(`[demo-seed] Seeded demo tenant: ${DEMO.organization.name}`);
  console.log(`[demo-seed] Login: ${DEMO.owner.email} / ${DEMO.owner.password}`);
}

function ensureAiSettings(repository, scope, now) {
  const existing = repository.findAiSettingsByScope(scope);
  if (existing) {
    repository.updateAiSettings(existing.id, {
      assistantName: 'Easy Assistant',
      tone: 'friendly',
      defaultLanguage: 'en',
      greetingMessage: 'Hi, I am the booking assistant. How can I help today?',
      humanHandoffMessage: 'Thanks. I am handing this to the team now.',
      autoConfirmBookings: true,
      reminderEnabled: true,
      updatedAt: now,
    });
    return repository.findAiSettingsByScope(scope);
  }

  return repository.createAiSettings({
    id: 'demo-ai-settings',
    organizationId: scope.organizationId,
    locationId: scope.locationId,
    assistantName: 'Easy Assistant',
    tone: 'friendly',
    defaultLanguage: 'en',
    greetingMessage: 'Hi, I am the booking assistant. How can I help today?',
    humanHandoffMessage: 'Thanks. I am handing this to the team now.',
    autoConfirmBookings: true,
    reminderEnabled: true,
    createdAt: now,
    updatedAt: now,
  });
}

function shiftAndSetHours(dayOffset, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function findOrganizationBySlug(db, slug) {
  return db.prepare('SELECT 1 FROM organizations WHERE slug = ? LIMIT 1').get(slug) ?? null;
}

main().catch((error) => {
  console.error('[demo-seed] Failed to seed demo data.');
  console.error(error);
  process.exitCode = 1;
});
