import type {
  AiSettings,
  Appointment,
  AvailabilitySlot,
  BusinessHour,
  Channel,
  Conversation,
  Customer,
  EntityId,
  ISODateString,
  Location,
  Membership,
  Message,
  Organization,
  Reminder,
  ReminderDelivery,
  Service,
  Staff,
  StaffHour,
  StaffService,
  TimeZoneString,
  User,
} from "../../app/types";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiRouteContract<Request, Response> {
  method: HttpMethod;
  path: string;
  request: Request;
  response: Response;
  authRequired: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface TenantScopedRequest {
  organizationId: EntityId;
  locationId?: EntityId;
}

export interface ConversationScopedRequest extends TenantScopedRequest {
  conversationId: EntityId;
}

export interface AvailabilitySlotsRequest extends TenantScopedRequest {
  serviceId: EntityId;
  date: ISODateString;
  staffId?: EntityId;
}

export interface AvailabilitySlotsResponse {
  date: ISODateString;
  timezone: TimeZoneString;
  slots: AvailabilitySlot[];
}

export interface ServiceMutationRequest extends TenantScopedRequest {
  service: Partial<Service>;
}

export interface StaffMutationRequest extends TenantScopedRequest {
  staff: Partial<Staff>;
}

export interface CustomerMutationRequest extends TenantScopedRequest {
  customer: Partial<Customer>;
}

export interface AppointmentMutationRequest extends TenantScopedRequest {
  appointment: Partial<Appointment>;
}

export interface BusinessHoursMutationRequest extends TenantScopedRequest {
  hours: Partial<BusinessHour>[];
}

export interface StaffHoursMutationRequest extends TenantScopedRequest {
  staffId: EntityId;
  hours: Partial<StaffHour>[];
}

export interface MessageMutationRequest extends ConversationScopedRequest {
  message: Partial<Message>;
}

export interface ChannelMutationRequest extends TenantScopedRequest {
  channel: Partial<Pick<Channel, "type" | "name" | "externalAccountId" | "externalPhoneNumberId" | "displayPhoneNumber" | "active" | "metadata">>;
  accessToken?: string | null;
  verifyToken?: string | null;
}

export const API_ROUTES = {
  signup: {
    method: "POST",
    path: "/api/auth/signup",
    authRequired: false,
  },
  login: {
    method: "POST",
    path: "/api/auth/login",
    authRequired: false,
  },
  logout: {
    method: "POST",
    path: "/api/auth/logout",
    authRequired: true,
  },
  currentUser: {
    method: "GET",
    path: "/api/auth/me",
    authRequired: true,
  },
  organizations: {
    method: "GET",
    path: "/api/organizations",
    authRequired: true,
  },
  locations: {
    method: "GET",
    path: "/api/locations",
    authRequired: true,
  },
  services: {
    method: "GET",
    path: "/api/services",
    authRequired: true,
  },
  serviceDetail: {
    method: "GET",
    path: "/api/services/:serviceId",
    authRequired: true,
  },
  createService: {
    method: "POST",
    path: "/api/services",
    authRequired: true,
  },
  updateService: {
    method: "PATCH",
    path: "/api/services/:serviceId",
    authRequired: true,
  },
  deleteService: {
    method: "DELETE",
    path: "/api/services/:serviceId",
    authRequired: true,
  },
  staff: {
    method: "GET",
    path: "/api/staff",
    authRequired: true,
  },
  staffDetail: {
    method: "GET",
    path: "/api/staff/:staffId",
    authRequired: true,
  },
  createStaff: {
    method: "POST",
    path: "/api/staff",
    authRequired: true,
  },
  updateStaff: {
    method: "PATCH",
    path: "/api/staff/:staffId",
    authRequired: true,
  },
  deleteStaff: {
    method: "DELETE",
    path: "/api/staff/:staffId",
    authRequired: true,
  },
  assignStaffService: {
    method: "POST",
    path: "/api/staff/:staffId/services",
    authRequired: true,
  },
  businessHours: {
    method: "GET",
    path: "/api/availability/business-hours",
    authRequired: true,
  },
  updateBusinessHours: {
    method: "PUT",
    path: "/api/availability/business-hours",
    authRequired: true,
  },
  staffHours: {
    method: "GET",
    path: "/api/availability/staff-hours/:staffId",
    authRequired: true,
  },
  updateStaffHours: {
    method: "PUT",
    path: "/api/availability/staff-hours/:staffId",
    authRequired: true,
  },
  availabilitySlots: {
    method: "GET",
    path: "/api/availability/slots",
    authRequired: true,
  },
  appointments: {
    method: "GET",
    path: "/api/appointments",
    authRequired: true,
  },
  appointmentDetail: {
    method: "GET",
    path: "/api/appointments/:appointmentId",
    authRequired: true,
  },
  createAppointment: {
    method: "POST",
    path: "/api/appointments",
    authRequired: true,
  },
  updateAppointment: {
    method: "PATCH",
    path: "/api/appointments/:appointmentId",
    authRequired: true,
  },
  updateAppointmentStatus: {
    method: "PATCH",
    path: "/api/appointments/:appointmentId/status",
    authRequired: true,
  },
  rescheduleAppointment: {
    method: "PATCH",
    path: "/api/appointments/:appointmentId/reschedule",
    authRequired: true,
  },
  deleteAppointment: {
    method: "DELETE",
    path: "/api/appointments/:appointmentId",
    authRequired: true,
  },
  customers: {
    method: "GET",
    path: "/api/customers",
    authRequired: true,
  },
  customerDetail: {
    method: "GET",
    path: "/api/customers/:customerId",
    authRequired: true,
  },
  createCustomer: {
    method: "POST",
    path: "/api/customers",
    authRequired: true,
  },
  updateCustomer: {
    method: "PATCH",
    path: "/api/customers/:customerId",
    authRequired: true,
  },
  deleteCustomer: {
    method: "DELETE",
    path: "/api/customers/:customerId",
    authRequired: true,
  },
  conversations: {
    method: "GET",
    path: "/api/conversations",
    authRequired: true,
  },
  conversationDetail: {
    method: "GET",
    path: "/api/conversations/:conversationId",
    authRequired: true,
  },
  messages: {
    method: "GET",
    path: "/api/conversations/:conversationId/messages",
    authRequired: true,
  },
  sendMessage: {
    method: "POST",
    path: "/api/conversations/:conversationId/messages",
    authRequired: true,
  },
  takeoverConversation: {
    method: "POST",
    path: "/api/conversations/:conversationId/takeover",
    authRequired: true,
  },
  humanTakeover: {
    method: "POST",
    path: "/api/conversations/:conversationId/human-takeover",
    authRequired: true,
  },
  closeConversation: {
    method: "POST",
    path: "/api/conversations/:conversationId/close",
    authRequired: true,
  },
  channels: {
    method: "GET",
    path: "/api/channels",
    authRequired: true,
  },
  channelDetail: {
    method: "GET",
    path: "/api/channels/:channelId",
    authRequired: true,
  },
  updateChannel: {
    method: "PATCH",
    path: "/api/channels/:channelId",
    authRequired: true,
  },
  whatsappWebhookVerify: {
    method: "GET",
    path: "/api/webhooks/whatsapp",
    authRequired: false,
  },
  whatsappWebhookReceive: {
    method: "POST",
    path: "/api/webhooks/whatsapp",
    authRequired: false,
  },
  aiSettings: {
    method: "GET",
    path: "/api/ai-settings",
    authRequired: true,
  },
  updateAiSettings: {
    method: "PATCH",
    path: "/api/ai-settings",
    authRequired: true,
  },
  reminders: {
    method: "GET",
    path: "/api/reminders",
    authRequired: true,
  },
  reminderDeliveries: {
    method: "GET",
    path: "/api/reminders/:reminderId/deliveries",
    authRequired: true,
  },
} as const;

export type ApiRouteKey = keyof typeof API_ROUTES;

export interface ApiContractMap {
  signup: ApiRouteContract<
    { name: string; email: string; password: string; organizationName: string; timezone: TimeZoneString },
    { user: User; organization: Organization; location: Location; membership: Membership }
  >;
  login: ApiRouteContract<{ email: string; password: string }, { user: User; memberships: Membership[] }>;
  logout: ApiRouteContract<Record<string, never>, { ok: true }>;
  currentUser: ApiRouteContract<Record<string, never>, { user: User; memberships: Membership[] }>;

  services: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Service>>;
  serviceDetail: ApiRouteContract<TenantScopedRequest & { serviceId: EntityId }, { service: Service }>;
  createService: ApiRouteContract<ServiceMutationRequest, { service: Service }>;
  updateService: ApiRouteContract<ServiceMutationRequest & { serviceId: EntityId }, { service: Service }>;
  deleteService: ApiRouteContract<TenantScopedRequest & { serviceId: EntityId }, { service: Service }>;

  staff: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Staff>>;
  staffDetail: ApiRouteContract<TenantScopedRequest & { staffId: EntityId }, { staff: Staff }>;
  createStaff: ApiRouteContract<StaffMutationRequest, { staff: Staff }>;
  updateStaff: ApiRouteContract<StaffMutationRequest & { staffId: EntityId }, { staff: Staff }>;
  deleteStaff: ApiRouteContract<TenantScopedRequest & { staffId: EntityId }, { staff: Staff }>;
  assignStaffService: ApiRouteContract<TenantScopedRequest & { staffId: EntityId; serviceId: EntityId }, { assignment: StaffService }>;

  businessHours: ApiRouteContract<TenantScopedRequest, PaginatedResponse<BusinessHour>>;
  updateBusinessHours: ApiRouteContract<BusinessHoursMutationRequest, { businessHours: BusinessHour[] }>;
  staffHours: ApiRouteContract<TenantScopedRequest & { staffId: EntityId }, PaginatedResponse<StaffHour>>;
  updateStaffHours: ApiRouteContract<StaffHoursMutationRequest, { staffHours: StaffHour[] }>;
  availabilitySlots: ApiRouteContract<AvailabilitySlotsRequest, AvailabilitySlotsResponse>;

  appointments: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Appointment>>;
  appointmentDetail: ApiRouteContract<TenantScopedRequest & { appointmentId: EntityId }, { appointment: Appointment }>;
  createAppointment: ApiRouteContract<AppointmentMutationRequest, { appointment: Appointment }>;
  updateAppointment: ApiRouteContract<AppointmentMutationRequest & { appointmentId: EntityId }, { appointment: Appointment }>;
  updateAppointmentStatus: ApiRouteContract<TenantScopedRequest & { appointmentId: EntityId; status: Appointment["status"] }, { appointment: Appointment }>;
  rescheduleAppointment: ApiRouteContract<
    TenantScopedRequest & { appointmentId: EntityId } & Partial<Pick<Appointment, "startTime" | "endTime" | "staffId" | "status">>,
    { appointment: Appointment }
  >;
  deleteAppointment: ApiRouteContract<TenantScopedRequest & { appointmentId: EntityId }, { appointment: Appointment }>;

  customers: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Customer>>;
  customerDetail: ApiRouteContract<TenantScopedRequest & { customerId: EntityId }, { customer: Customer }>;
  createCustomer: ApiRouteContract<CustomerMutationRequest, { customer: Customer }>;
  updateCustomer: ApiRouteContract<CustomerMutationRequest & { customerId: EntityId }, { customer: Customer }>;
  deleteCustomer: ApiRouteContract<TenantScopedRequest & { customerId: EntityId }, { customer: Customer }>;

  conversations: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Conversation>>;
  conversationDetail: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  messages: ApiRouteContract<ConversationScopedRequest, PaginatedResponse<Message>>;
  sendMessage: ApiRouteContract<MessageMutationRequest, { message: Message }>;
  takeoverConversation: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  humanTakeover: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  closeConversation: ApiRouteContract<ConversationScopedRequest, { conversation: Conversation }>;
  channels: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Channel>>;
  channelDetail: ApiRouteContract<TenantScopedRequest & { channelId: EntityId }, { channel: Channel }>;
  updateChannel: ApiRouteContract<ChannelMutationRequest & { channelId: EntityId }, { channel: Channel }>;
  whatsappWebhookVerify: ApiRouteContract<Record<string, string>, { challenge: string }>;
  whatsappWebhookReceive: ApiRouteContract<Record<string, unknown>, { ok: true; processed: number }>;
  aiSettings: ApiRouteContract<TenantScopedRequest, { settings: AiSettings }>;
  reminders: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Reminder>>;
  reminderDeliveries: ApiRouteContract<TenantScopedRequest & { reminderId: EntityId }, PaginatedResponse<ReminderDelivery>>;
}
