import type {
  AiSettings,
  Appointment,
  AvailabilitySlot,
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
  StaffService,
  TimeZoneString,
  User,
} from "../../app/types";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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
  staffHours: {
    method: "GET",
    path: "/api/availability/staff-hours",
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
  createAppointment: {
    method: "POST",
    path: "/api/appointments",
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
  customers: {
    method: "GET",
    path: "/api/customers",
    authRequired: true,
  },
  conversations: {
    method: "GET",
    path: "/api/conversations",
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
  humanTakeover: {
    method: "POST",
    path: "/api/conversations/:conversationId/human-takeover",
    authRequired: true,
  },
  channels: {
    method: "GET",
    path: "/api/channels",
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
  createService: ApiRouteContract<Partial<Service> & TenantScopedRequest, { service: Service }>;
  updateService: ApiRouteContract<Partial<Service> & TenantScopedRequest, { service: Service }>;
  staff: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Staff>>;
  createStaff: ApiRouteContract<Partial<Staff> & TenantScopedRequest, { staff: Staff }>;
  assignStaffService: ApiRouteContract<TenantScopedRequest & { serviceId: EntityId }, { assignment: StaffService }>;
  availabilitySlots: ApiRouteContract<AvailabilitySlotsRequest, AvailabilitySlotsResponse>;
  appointments: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Appointment>>;
  createAppointment: ApiRouteContract<Partial<Appointment> & TenantScopedRequest, { appointment: Appointment }>;
  customers: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Customer>>;
  conversations: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Conversation>>;
  messages: ApiRouteContract<TenantScopedRequest & { conversationId: EntityId }, PaginatedResponse<Message>>;
  channels: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Channel>>;
  aiSettings: ApiRouteContract<TenantScopedRequest, { settings: AiSettings }>;
  reminders: ApiRouteContract<TenantScopedRequest, PaginatedResponse<Reminder>>;
  reminderDeliveries: ApiRouteContract<TenantScopedRequest & { reminderId: EntityId }, PaginatedResponse<ReminderDelivery>>;
}
