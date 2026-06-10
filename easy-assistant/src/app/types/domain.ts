export type EntityId = string;
export type ISODateString = string;
export type ISODateTimeString = string;
export type TimeOfDayString = string;
export type TimeZoneString = string;
export type CurrencyCode = string;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimestampedEntity {
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Organization extends TimestampedEntity {
  id: EntityId;
  name: string;
  slug: string;
  timezone: TimeZoneString;
  ownerUserId: EntityId | null;
}

export interface Location extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  name: string;
  timezone: TimeZoneString;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  phone: string | null;
  active: boolean;
}

export const USER_STATUSES = ["active", "invited", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User extends TimestampedEntity {
  id: EntityId;
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  lastLoginAt: ISODateTimeString | null;
}

export const MEMBERSHIP_ROLES = ["owner", "admin", "staff"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export interface Membership extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  userId: EntityId;
  role: MembershipRole;
  active: boolean;
}

export interface Session {
  id: EntityId;
  userId: EntityId;
  tokenHash: string;
  expiresAt: ISODateTimeString;
  revokedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export interface Service extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: CurrencyCode;
  active: boolean;
}

export interface Staff extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  name: string;
  roleTitle: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  active: boolean;
}

export interface StaffService extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  staffId: EntityId;
  serviceId: EntityId;
  active: boolean;
}

export interface BusinessHour extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  weekday: Weekday;
  openTime: TimeOfDayString;
  closeTime: TimeOfDayString;
  active: boolean;
}

export interface StaffHour extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  staffId: EntityId;
  weekday: Weekday;
  startTime: TimeOfDayString;
  endTime: TimeOfDayString;
  active: boolean;
}

export const CUSTOMER_CONSENT_STATUSES = ["unknown", "opted_in", "opted_out"] as const;
export type CustomerConsentStatus = (typeof CUSTOMER_CONSENT_STATUSES)[number];

export interface Customer extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  name: string | null;
  phone: string;
  email: string | null;
  sourceChannel: ChannelType;
  consentStatus: CustomerConsentStatus;
  lastSeenAt: ISODateTimeString | null;
}

export const CHANNEL_TYPES = ["whatsapp", "manual"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export interface Channel extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  type: ChannelType;
  name: string;
  externalAccountId: string | null;
  externalPhoneNumberId: string | null;
  displayPhoneNumber: string | null;
  encryptedAccessToken: string | null;
  verifyTokenHash: string | null;
  active: boolean;
  metadata: JsonValue;
}

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_CREATED_BY = ["manual", "ai", "system"] as const;
export type AppointmentCreatedBy = (typeof APPOINTMENT_CREATED_BY)[number];

export interface Appointment extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  customerId: EntityId;
  serviceId: EntityId;
  staffId: EntityId;
  channelId: EntityId | null;
  conversationId: EntityId | null;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  status: AppointmentStatus;
  notes: string | null;
  createdBy: AppointmentCreatedBy;
}

export const CONVERSATION_STATES = ["ai_handled", "human_handled", "closed"] as const;
export type ConversationState = (typeof CONVERSATION_STATES)[number];

export interface Conversation extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  channelId: EntityId;
  customerId: EntityId | null;
  externalConversationId: string | null;
  state: ConversationState;
  lastMessageAt: ISODateTimeString | null;
  assignedUserId: EntityId | null;
}

export const MESSAGE_SENDERS = ["customer", "ai", "human", "system"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound", "internal"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export interface Message extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  conversationId: EntityId;
  sender: MessageSender;
  direction: MessageDirection;
  body: string;
  externalMessageId: string | null;
  sentAt: ISODateTimeString;
  metadata: JsonValue;
}

export const AI_TONES = ["friendly", "professional", "formal"] as const;
export type AiTone = (typeof AI_TONES)[number];

export interface AiSettings extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  assistantName: string;
  tone: AiTone;
  defaultLanguage: string;
  greetingMessage: string;
  humanHandoffMessage: string;
  autoConfirmBookings: boolean;
  reminderEnabled: boolean;
}

export const REMINDER_STATUSES = ["scheduled", "sent", "failed", "cancelled"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface Reminder extends TimestampedEntity {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  appointmentId: EntityId;
  channelId: EntityId;
  scheduledFor: ISODateTimeString;
  sentAt: ISODateTimeString | null;
  status: ReminderStatus;
  templateBody: string;
  failureReason: string | null;
}

export interface ReminderDelivery {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId;
  reminderId: EntityId;
  channelId: EntityId;
  providerMessageId: string | null;
  status: ReminderStatus;
  attemptedAt: ISODateTimeString;
  responseMetadata: JsonValue;
}

export interface AuditLog {
  id: EntityId;
  organizationId: EntityId;
  locationId: EntityId | null;
  actorUserId: EntityId | null;
  actorType: "user" | "ai" | "system";
  action: string;
  entityType: string;
  entityId: EntityId | null;
  metadata: JsonValue;
  createdAt: ISODateTimeString;
}

export interface AvailabilitySlot {
  start: ISODateTimeString;
  end: ISODateTimeString;
  staffId: EntityId;
}
