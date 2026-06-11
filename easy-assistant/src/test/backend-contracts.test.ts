import { describe, expect, it } from 'vitest';
import type {
  ApiRouteContract,
  AiReceptionistRunRequest,
  AiReceptionistRunResponse,
  AiSettingsMutationRequest,
  AvailabilitySlotsRequest,
  AvailabilitySlotsResponse,
  ConversationScopedRequest,
  MessageMutationRequest,
  PaginatedResponse,
  TenantScopedRequest,
} from '../server/api/contracts';
import { API_ROUTES } from '../server/api/contracts';
import { LOCATION_SCOPED_MVP_TABLES, MVP_TABLES, SCOPED_MVP_TABLES } from '../server/data/schema';
import {
  assertValidAppointmentWindow,
  canTransitionAppointmentStatus,
  isBlockingAppointmentStatus,
} from '../server/domain';
import type {
  AiSettings,
  AuditLog,
  Appointment,
  BusinessHour,
  Channel,
  Conversation,
  Customer,
  Message,
  Service,
  Staff,
  StaffHour,
  StaffService,
} from '../app/types';

describe('backend auth and domain contracts', () => {
  it('keeps the auth/session routes aligned with the MVP contract surface', () => {
    expect(API_ROUTES.signup).toMatchObject({
      method: 'POST',
      path: '/api/auth/signup',
      authRequired: false,
    });
    expect(API_ROUTES.login).toMatchObject({
      method: 'POST',
      path: '/api/auth/login',
      authRequired: false,
    });
    expect(API_ROUTES.logout).toMatchObject({
      method: 'POST',
      path: '/api/auth/logout',
      authRequired: true,
    });
    expect(API_ROUTES.currentUser).toMatchObject({
      method: 'GET',
      path: '/api/auth/me',
      authRequired: true,
    });
  });

  it('keeps the phase-2 CRUD and availability routes aligned with the SQLite backend surface', () => {
    expect(API_ROUTES.services).toMatchObject({ method: 'GET', path: '/api/services', authRequired: true });
    expect(API_ROUTES.serviceDetail).toMatchObject({
      method: 'GET',
      path: '/api/services/:serviceId',
      authRequired: true,
    });
    expect(API_ROUTES.staffDetail).toMatchObject({
      method: 'GET',
      path: '/api/staff/:staffId',
      authRequired: true,
    });
    expect(API_ROUTES.updateBusinessHours).toMatchObject({
      method: 'PUT',
      path: '/api/availability/business-hours',
      authRequired: true,
    });
    expect(API_ROUTES.updateStaffHours).toMatchObject({
      method: 'PUT',
      path: '/api/availability/staff-hours/:staffId',
      authRequired: true,
    });
    expect(API_ROUTES.appointmentDetail).toMatchObject({
      method: 'GET',
      path: '/api/appointments/:appointmentId',
      authRequired: true,
    });
    expect(API_ROUTES.deleteAppointment).toMatchObject({
      method: 'DELETE',
      path: '/api/appointments/:appointmentId',
      authRequired: true,
    });
    expect(API_ROUTES.customerDetail).toMatchObject({
      method: 'GET',
      path: '/api/customers/:customerId',
      authRequired: true,
    });
  });

  it('keeps the ai settings and receptionist routes aligned with the backend surface', () => {
    expect(API_ROUTES.aiSettings).toMatchObject({
      method: 'GET',
      path: '/api/ai-settings',
      authRequired: true,
    });
    expect(API_ROUTES.updateAiSettings).toMatchObject({
      method: 'PATCH',
      path: '/api/ai-settings',
      authRequired: true,
    });
    expect(API_ROUTES.aiReceptionistRun).toMatchObject({
      method: 'POST',
      path: '/api/ai/receptionist/run',
      authRequired: true,
    });
  });

  it('keeps session and tenant tables in the phase-1 schema lists', () => {
    expect(MVP_TABLES).toEqual(
      expect.arrayContaining(['organizations', 'locations', 'users', 'sessions', 'memberships']),
    );
    expect(SCOPED_MVP_TABLES).toEqual(
      expect.arrayContaining([
        'locations',
        'memberships',
        'services',
        'staff',
        'staff_services',
        'business_hours',
        'staff_hours',
        'customers',
        'channels',
        'conversations',
        'messages',
        'appointments',
        'ai_settings',
        'reminders',
        'reminder_deliveries',
        'audit_logs',
      ]),
    );
    expect(LOCATION_SCOPED_MVP_TABLES).toEqual(
      expect.arrayContaining([
        'services',
        'staff',
        'staff_services',
        'business_hours',
        'staff_hours',
        'customers',
        'channels',
        'conversations',
        'messages',
        'appointments',
        'ai_settings',
        'reminders',
        'reminder_deliveries',
      ]),
    );
    expect(LOCATION_SCOPED_MVP_TABLES).not.toContain('users');
    expect(LOCATION_SCOPED_MVP_TABLES).not.toContain('sessions');
  });

  it('treats blocking appointment states and invalid windows consistently', () => {
    expect(isBlockingAppointmentStatus('pending')).toBe(true);
    expect(isBlockingAppointmentStatus('rescheduled')).toBe(true);
    expect(isBlockingAppointmentStatus('completed')).toBe(false);
    expect(canTransitionAppointmentStatus('pending', 'confirmed')).toBe(true);
    expect(canTransitionAppointmentStatus('completed', 'confirmed')).toBe(false);
    expect(() =>
      assertValidAppointmentWindow('2026-06-11T10:00:00+06:00', '2026-06-11T10:00:00+06:00'),
    ).toThrow('Appointment endTime must be after startTime.');
    expect(() =>
      assertValidAppointmentWindow('not-a-real-iso-date', '2026-06-11T10:30:00+06:00'),
    ).toThrow('Appointment startTime and endTime must be valid ISO date-time values.');
  });
});

const phase2Timestamp = '2026-06-11T00:00:00+06:00';

const phase2Service: Service = {
  id: 'svc-haircut',
  organizationId: 'org-1',
  locationId: 'loc-1',
  name: 'Haircut',
  category: 'Hair',
  description: 'Basic trim and shaping',
  durationMinutes: 30,
  bufferMinutes: 10,
  price: 2500,
  currency: 'BDT',
  active: true,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2Staff: Staff = {
  id: 'staff-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  name: 'Ayesha',
  roleTitle: 'Stylist',
  email: 'ayesha@example.com',
  phone: '+8801700000000',
  avatarUrl: null,
  active: true,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2Assignment: StaffService = {
  id: 'assign-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  staffId: phase2Staff.id,
  serviceId: phase2Service.id,
  active: true,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2BusinessHour: BusinessHour = {
  id: 'hours-business-thursday',
  organizationId: 'org-1',
  locationId: 'loc-1',
  weekday: 4,
  openTime: '10:00',
  closeTime: '18:00',
  active: true,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2StaffHour: StaffHour = {
  id: 'hours-staff-thursday',
  organizationId: 'org-1',
  locationId: 'loc-1',
  staffId: phase2Staff.id,
  weekday: 4,
  startTime: '10:30',
  endTime: '17:30',
  active: true,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2Customer: Customer = {
  id: 'customer-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  name: 'Nadia Rahman',
  phone: '+8801711111111',
  email: 'nadia@example.com',
  sourceChannel: 'manual',
  consentStatus: 'opted_in',
  lastSeenAt: phase2Timestamp,
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

const phase2Appointment: Appointment = {
  id: 'appt-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  customerId: phase2Customer.id,
  serviceId: phase2Service.id,
  staffId: phase2Staff.id,
  channelId: null,
  conversationId: null,
  startTime: '2026-06-11T11:00:00+06:00',
  endTime: '2026-06-11T11:40:00+06:00',
  status: 'confirmed',
  notes: 'Morning preferred',
  createdBy: 'manual',
  createdAt: phase2Timestamp,
  updatedAt: phase2Timestamp,
};

function paginated<T>(items: T[]): PaginatedResponse<T> {
  return {
    items,
    nextCursor: null,
  };
}

const phase2Contracts = {
  services: {
    method: 'GET',
    path: '/api/services',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase2Service]),
  },
  createService: {
    method: 'POST',
    path: '/api/services',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: phase2Service.name,
      category: phase2Service.category,
      description: phase2Service.description,
      durationMinutes: phase2Service.durationMinutes,
      bufferMinutes: phase2Service.bufferMinutes,
      price: phase2Service.price,
      currency: phase2Service.currency,
      active: phase2Service.active,
    },
    response: {
      service: phase2Service,
    },
  },
  updateService: {
    method: 'PATCH',
    path: '/api/services/:serviceId',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: phase2Service.name,
    },
    response: {
      service: phase2Service,
    },
  },
  staff: {
    method: 'GET',
    path: '/api/staff',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase2Staff]),
  },
  createStaff: {
    method: 'POST',
    path: '/api/staff',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: phase2Staff.name,
      roleTitle: phase2Staff.roleTitle,
      email: phase2Staff.email,
      phone: phase2Staff.phone,
      avatarUrl: phase2Staff.avatarUrl,
      active: phase2Staff.active,
    },
    response: {
      staff: phase2Staff,
    },
  },
  updateStaff: {
    method: 'PATCH',
    path: '/api/staff/:staffId',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      active: phase2Staff.active,
    },
    response: {
      staff: phase2Staff,
    },
  },
  assignStaffService: {
    method: 'POST',
    path: '/api/staff/:staffId/services',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      serviceId: phase2Service.id,
    },
    response: {
      assignment: phase2Assignment,
    },
  },
  availabilitySlots: {
    method: 'GET',
    path: '/api/availability/slots',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      serviceId: phase2Service.id,
      date: '2026-06-11',
      staffId: phase2Staff.id,
    } satisfies AvailabilitySlotsRequest,
    response: {
      date: '2026-06-11',
      timezone: 'Asia/Dhaka',
      slots: [
        {
          start: '2026-06-11T10:30:00+06:00',
          end: '2026-06-11T11:10:00+06:00',
          staffId: phase2Staff.id,
        },
      ],
    } satisfies AvailabilitySlotsResponse,
  },
  appointments: {
    method: 'GET',
    path: '/api/appointments',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase2Appointment]),
  },
  createAppointment: {
    method: 'POST',
    path: '/api/appointments',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      customerId: phase2Customer.id,
      serviceId: phase2Service.id,
      staffId: phase2Staff.id,
      startTime: phase2Appointment.startTime,
      endTime: phase2Appointment.endTime,
      status: phase2Appointment.status,
      createdBy: phase2Appointment.createdBy,
      notes: phase2Appointment.notes,
    },
    response: {
      appointment: phase2Appointment,
    },
  },
  customers: {
    method: 'GET',
    path: '/api/customers',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase2Customer]),
  },
} satisfies {
  services: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Service>>;
  createService: ApiRouteContract<Partial<Service> & TenantScopedRequest, { service: Service }>;
  updateService: ApiRouteContract<Partial<Service> & TenantScopedRequest, { service: Service }>;
  staff: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Staff>>;
  createStaff: ApiRouteContract<Partial<Staff> & TenantScopedRequest, { staff: Staff }>;
  updateStaff: ApiRouteContract<Partial<Staff> & TenantScopedRequest, { staff: Staff }>;
  assignStaffService: ApiRouteContract<TenantScopedRequest & { serviceId: string }, { assignment: StaffService }>;
  availabilitySlots: ApiRouteContract<AvailabilitySlotsRequest, AvailabilitySlotsResponse>;
  appointments: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Appointment>>;
  createAppointment: ApiRouteContract<Partial<Appointment> & TenantScopedRequest, { appointment: Appointment }>;
  customers: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Customer>>;
};

const phase4Timestamp = '2026-06-11T01:00:00+06:00';

const phase4ConversationOpen: Conversation = {
  id: 'conv-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  channelId: 'channel-whatsapp',
  customerId: phase2Customer.id,
  externalConversationId: 'wa-thread-1',
  state: 'ai_handled',
  lastMessageAt: phase4Timestamp,
  assignedUserId: null,
  createdAt: phase4Timestamp,
  updatedAt: phase4Timestamp,
};

const phase4ConversationHuman: Conversation = {
  ...phase4ConversationOpen,
  state: 'human_handled',
  assignedUserId: 'user-human-1',
  updatedAt: '2026-06-11T01:15:00+06:00',
};

const phase4ConversationClosed: Conversation = {
  ...phase4ConversationOpen,
  state: 'closed',
  updatedAt: '2026-06-11T01:30:00+06:00',
};

const phase4Message: Message = {
  id: 'msg-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  conversationId: phase4ConversationOpen.id,
  sender: 'human',
  direction: 'outbound',
  body: 'I have taken over this conversation.',
  externalMessageId: null,
  sentAt: phase4Timestamp,
  metadata: { source: 'manual-takeover' },
  createdAt: phase4Timestamp,
  updatedAt: phase4Timestamp,
};

const phase4Channel: Channel = {
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
  active: true,
  metadata: { provider: 'whatsapp' },
  createdAt: phase4Timestamp,
  updatedAt: phase4Timestamp,
};

const phase4ConversationContracts = {
  conversations: {
    method: 'GET',
    path: '/api/conversations',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase4ConversationOpen]),
  },
  conversationDetail: {
    method: 'GET',
    path: '/api/conversations/:conversationId',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
    } satisfies ConversationScopedRequest,
    response: {
      conversation: phase4ConversationOpen,
    },
  },
  messages: {
    method: 'GET',
    path: '/api/conversations/:conversationId/messages',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
    } satisfies ConversationScopedRequest,
    response: paginated([phase4Message]),
  },
  sendMessage: {
    method: 'POST',
    path: '/api/conversations/:conversationId/messages',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
      message: {
        body: phase4Message.body,
        sender: phase4Message.sender,
        direction: phase4Message.direction,
      },
    } satisfies MessageMutationRequest,
    response: {
      message: phase4Message,
    },
  },
  takeoverConversation: {
    method: 'POST',
    path: '/api/conversations/:conversationId/takeover',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
    } satisfies ConversationScopedRequest,
    response: {
      conversation: phase4ConversationHuman,
    },
  },
  humanTakeover: {
    method: 'POST',
    path: '/api/conversations/:conversationId/human-takeover',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
    } satisfies ConversationScopedRequest,
    response: {
      conversation: phase4ConversationHuman,
    },
  },
  closeConversation: {
    method: 'POST',
    path: '/api/conversations/:conversationId/close',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase4ConversationOpen.id,
    } satisfies ConversationScopedRequest,
    response: {
      conversation: phase4ConversationClosed,
    },
  },
  channels: {
    method: 'GET',
    path: '/api/channels',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: paginated([phase4Channel]),
  },
} satisfies {
  conversations: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Conversation>>;
  conversationDetail: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  messages: ApiRouteContract<ConversationScopedRequest, PaginatedResponse<Message>>;
  sendMessage: ApiRouteContract<MessageMutationRequest, { message: Message }>;
  takeoverConversation: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  humanTakeover: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  closeConversation: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  channels: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Channel>>;
};

describe('phase 2 core booking data contracts', () => {
  it('keeps the phase 2 route metadata aligned for services, staff, availability, customers, and appointments', () => {
    expect(API_ROUTES.services).toMatchObject({
      method: 'GET',
      path: '/api/services',
      authRequired: true,
    });
    expect(API_ROUTES.createService).toMatchObject({
      method: 'POST',
      path: '/api/services',
      authRequired: true,
    });
    expect(API_ROUTES.updateService).toMatchObject({
      method: 'PATCH',
      path: '/api/services/:serviceId',
      authRequired: true,
    });
    expect(API_ROUTES.deleteService).toMatchObject({
      method: 'DELETE',
      path: '/api/services/:serviceId',
      authRequired: true,
    });

    expect(API_ROUTES.staff).toMatchObject({
      method: 'GET',
      path: '/api/staff',
      authRequired: true,
    });
    expect(API_ROUTES.createStaff).toMatchObject({
      method: 'POST',
      path: '/api/staff',
      authRequired: true,
    });
    expect(API_ROUTES.updateStaff).toMatchObject({
      method: 'PATCH',
      path: '/api/staff/:staffId',
      authRequired: true,
    });
    expect(API_ROUTES.assignStaffService).toMatchObject({
      method: 'POST',
      path: '/api/staff/:staffId/services',
      authRequired: true,
    });

    expect(API_ROUTES.businessHours).toMatchObject({
      method: 'GET',
      path: '/api/availability/business-hours',
      authRequired: true,
    });
    expect(API_ROUTES.staffHours).toMatchObject({
      method: 'GET',
      path: '/api/availability/staff-hours/:staffId',
      authRequired: true,
    });
    expect(API_ROUTES.availabilitySlots).toMatchObject({
      method: 'GET',
      path: '/api/availability/slots',
      authRequired: true,
    });

    expect(API_ROUTES.appointments).toMatchObject({
      method: 'GET',
      path: '/api/appointments',
      authRequired: true,
    });
    expect(API_ROUTES.createAppointment).toMatchObject({
      method: 'POST',
      path: '/api/appointments',
      authRequired: true,
    });
    expect(API_ROUTES.updateAppointmentStatus).toMatchObject({
      method: 'PATCH',
      path: '/api/appointments/:appointmentId/status',
      authRequired: true,
    });
    expect(API_ROUTES.rescheduleAppointment).toMatchObject({
      method: 'PATCH',
      path: '/api/appointments/:appointmentId/reschedule',
      authRequired: true,
    });

    expect(API_ROUTES.customers).toMatchObject({
      method: 'GET',
      path: '/api/customers',
      authRequired: true,
    });
  });

  it('keeps the phase 2 booking-data samples tenant-scoped and shaped for CRUD and slot lookups', () => {
    expect(phase2Contracts.services.request.organizationId).toBe('org-1');
    expect(phase2Contracts.services.response.items).toHaveLength(1);
    expect(phase2Contracts.createService.response.service.id).toBe(phase2Service.id);
    expect(phase2Contracts.staff.response.items[0]!.email).toBe('ayesha@example.com');
    expect(phase2BusinessHour.openTime).toBe('10:00');
    expect(phase2StaffHour.endTime).toBe('17:30');
    expect(phase2Contracts.assignStaffService.response.assignment.serviceId).toBe(phase2Service.id);
    expect(phase2Contracts.availabilitySlots.request.date).toBe('2026-06-11');
    expect(phase2Contracts.availabilitySlots.response.slots[0]!.staffId).toBe(phase2Staff.id);
    expect(phase2Contracts.appointments.response.items[0]!.status).toBe('confirmed');
    expect(phase2Contracts.createAppointment.response.appointment.customerId).toBe(phase2Customer.id);
    expect(phase2Contracts.customers.response.items[0]!.consentStatus).toBe('opted_in');
  });
});

describe('phase 4 conversation contracts', () => {
  it('keeps the briefed conversation, message, takeover, close, and channel routes aligned', () => {
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

  it('keeps the conversation contract samples tenant-scoped and state-aware', () => {
    expect(phase4ConversationContracts.conversations.request.organizationId).toBe('org-1');
    expect(phase4ConversationContracts.conversationDetail.request.conversationId).toBe(phase4ConversationOpen.id);
    expect(phase4ConversationContracts.messages.request.conversationId).toBe(phase4ConversationOpen.id);
    expect(phase4ConversationContracts.sendMessage.request.message.body).toBe(phase4Message.body);
    expect(phase4ConversationContracts.takeoverConversation.response.conversation.state).toBe('human_handled');
    expect(phase4ConversationContracts.humanTakeover.path).toBe('/api/conversations/:conversationId/human-takeover');
    expect(phase4ConversationContracts.closeConversation.response.conversation.state).toBe('closed');
    expect(phase4ConversationContracts.channels.response.items).toHaveLength(1);
  });
});

const phase6Timestamp = '2026-06-11T02:00:00+06:00';
const phase6AiSettingsId = 'ai-settings-1';

const phase6Conversation: Conversation = {
  id: 'conv-ai-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  channelId: phase4Channel.id,
  customerId: phase2Customer.id,
  externalConversationId: 'wa-thread-ai-1',
  state: 'ai_handled',
  lastMessageAt: phase6Timestamp,
  assignedUserId: null,
  createdAt: phase6Timestamp,
  updatedAt: phase6Timestamp,
};

const phase6DefaultAiSettings: AiSettings = {
  id: phase6AiSettingsId,
  organizationId: 'org-1',
  locationId: 'loc-1',
  assistantName: 'Easy Assistant',
  tone: 'friendly',
  defaultLanguage: 'en',
  greetingMessage: "Hi! I'm your booking assistant. How can I help you today?",
  humanHandoffMessage: 'Thanks. A human team member will take it from here.',
  autoConfirmBookings: true,
  reminderEnabled: false,
  createdAt: phase6Timestamp,
  updatedAt: phase6Timestamp,
};

const phase6UpdatedAiSettings: AiSettings = {
  ...phase6DefaultAiSettings,
  assistantName: 'Mina AI',
  tone: 'professional',
  defaultLanguage: 'bn',
  greetingMessage: 'Assalamu alaikum! How can I help with your booking?',
  humanHandoffMessage: 'A human team member will take it from here.',
  autoConfirmBookings: false,
  reminderEnabled: true,
  updatedAt: '2026-06-11T02:10:00+06:00',
};

const phase6ToolCall = {
  type: 'createAppointment',
  customerId: phase2Customer.id,
  serviceId: phase2Service.id,
  staffId: phase2Staff.id,
  channelId: phase4Channel.id,
  conversationId: phase6Conversation.id,
  startTime: '2026-06-11T04:00:00.000Z',
  endTime: '2026-06-11T04:30:00.000Z',
  notes: 'Prefer the morning slot',
  intent: 'book',
} as const;

const phase6Appointment: Appointment = {
  id: 'appt-ai-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  customerId: phase2Customer.id,
  serviceId: phase2Service.id,
  staffId: phase2Staff.id,
  channelId: phase4Channel.id,
  conversationId: phase6Conversation.id,
  startTime: '2026-06-11T04:00:00.000Z',
  endTime: '2026-06-11T04:30:00.000Z',
  status: 'pending',
  notes: 'Prefer the morning slot',
  createdBy: 'ai',
  createdAt: phase6Timestamp,
  updatedAt: phase6Timestamp,
};

const phase6Message: Message = {
  id: 'msg-ai-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  conversationId: phase6Conversation.id,
  sender: 'ai',
  direction: 'outbound',
  body: "Mina AI: You're booked for 2026-06-11T04:00:00.000Z. I'll confirm the details shortly.",
  externalMessageId: null,
  sentAt: phase6Timestamp,
  metadata: {
    source: 'ai-receptionist',
    intent: 'book',
    toolCallType: 'createAppointment',
    aiSettingsId: phase6AiSettingsId,
    auditLogId: 'audit-ai-1',
    transport: 'whatsapp',
    deliveryStatus: 'queued',
    channelId: phase4Channel.id,
    channelType: 'whatsapp',
  },
  createdAt: phase6Timestamp,
  updatedAt: phase6Timestamp,
};

const phase6AuditLog: AuditLog = {
  id: 'audit-ai-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  actorUserId: 'user-1',
  actorType: 'ai',
  action: 'ai_receptionist.create_appointment',
  entityType: 'appointment',
  entityId: phase6Appointment.id,
  metadata: {
    intent: 'book',
    messageText: 'Please book me a haircut tomorrow morning.',
    toolCall: phase6ToolCall,
    assistantName: phase6UpdatedAiSettings.assistantName,
    autoConfirmBookings: phase6UpdatedAiSettings.autoConfirmBookings,
  },
  createdAt: phase6Timestamp,
};

const phase6Contracts = {
  aiSettings: {
    method: 'GET',
    path: '/api/ai-settings',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
    } satisfies TenantScopedRequest,
    response: {
      settings: phase6DefaultAiSettings,
    },
  },
  updateAiSettings: {
    method: 'PATCH',
    path: '/api/ai-settings',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      settings: {
        assistantName: phase6UpdatedAiSettings.assistantName,
        tone: phase6UpdatedAiSettings.tone,
        defaultLanguage: phase6UpdatedAiSettings.defaultLanguage,
        greetingMessage: phase6UpdatedAiSettings.greetingMessage,
        humanHandoffMessage: phase6UpdatedAiSettings.humanHandoffMessage,
        autoConfirmBookings: phase6UpdatedAiSettings.autoConfirmBookings,
        reminderEnabled: phase6UpdatedAiSettings.reminderEnabled,
      },
    } satisfies AiSettingsMutationRequest,
    response: {
      settings: phase6UpdatedAiSettings,
    },
  },
  aiReceptionistRun: {
    method: 'POST',
    path: '/api/ai/receptionist/run',
    authRequired: true,
    request: {
      organizationId: 'org-1',
      locationId: 'loc-1',
      conversationId: phase6Conversation.id,
      message: 'Please book me a haircut tomorrow morning.',
      intent: 'book',
      toolCall: phase6ToolCall,
    } satisfies AiReceptionistRunRequest,
    response: {
      settings: phase6UpdatedAiSettings,
      assistantMessage: phase6Message.body,
      appointment: phase6Appointment,
      conversation: phase6Conversation,
      message: phase6Message,
      auditLog: phase6AuditLog,
    } satisfies AiReceptionistRunResponse,
  },
} satisfies {
  aiSettings: ApiRouteContract<TenantScopedRequest, { settings: AiSettings }>;
  updateAiSettings: ApiRouteContract<AiSettingsMutationRequest, { settings: AiSettings }>;
  aiReceptionistRun: ApiRouteContract<AiReceptionistRunRequest, AiReceptionistRunResponse>;
};

describe('phase 6 AI receptionist contracts', () => {
  it('keeps the AI settings and receptionist route metadata aligned', () => {
    expect(API_ROUTES.aiSettings).toMatchObject({
      method: 'GET',
      path: '/api/ai-settings',
      authRequired: true,
    });
    expect(API_ROUTES.updateAiSettings).toMatchObject({
      method: 'PATCH',
      path: '/api/ai-settings',
      authRequired: true,
    });
    expect(API_ROUTES.aiReceptionistRun).toMatchObject({
      method: 'POST',
      path: '/api/ai/receptionist/run',
      authRequired: true,
    });
  });

  it('keeps the AI settings CRUD and receptionist sample payloads tenant-scoped and tool-call shaped', () => {
    expect(phase6Contracts.aiSettings.request.organizationId).toBe('org-1');
    expect(phase6Contracts.aiSettings.response.settings.assistantName).toBe('Easy Assistant');
    expect(phase6Contracts.updateAiSettings.request.settings.tone).toBe('professional');
    expect(phase6Contracts.updateAiSettings.response.settings.autoConfirmBookings).toBe(false);
    expect(phase6Contracts.aiReceptionistRun.request.toolCall.type).toBe('createAppointment');
    expect(phase6Contracts.aiReceptionistRun.request.toolCall.channelId).toBe(phase4Channel.id);
    expect(phase6Contracts.aiReceptionistRun.response.appointment?.createdBy).toBe('ai');
    expect(phase6Contracts.aiReceptionistRun.response.message?.sender).toBe('ai');
    expect(phase6Contracts.aiReceptionistRun.response.auditLog.action).toBe('ai_receptionist.create_appointment');
    expect(phase6Contracts.aiReceptionistRun.response.settings.assistantName).toBe('Mina AI');
  });
});
