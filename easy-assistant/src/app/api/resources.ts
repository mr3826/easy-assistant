import type {
  Appointment,
  AiSettings,
  AuditLog,
  Channel,
  BusinessHour,
  Conversation,
  Customer,
  Message,
  Service,
  Staff,
  StaffService,
  StaffHour,
} from '../types';
import { apiRequest } from './client';

export interface TenantScope {
  organizationId: string;
  locationId: string;
}

export interface ConversationThreadSummary extends Conversation {
  customerName?: string | null;
  customerPhone?: string | null;
  channelName?: string | null;
  channelType?: Channel['type'] | null;
  channelDisplayPhoneNumber?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number | null;
}

export interface ConversationThreadDetail {
  conversation: Conversation;
  customer: Customer | null;
  channel: Channel | null;
  messages: Message[];
}

export interface DashboardSummaryMetric {
  key: string;
  label: string;
  value: number | null;
  format: 'number' | 'percent' | 'currency' | 'duration' | 'text';
  delta?: number | null;
  deltaLabel?: string | null;
  trend?: 'up' | 'down' | 'flat' | null;
  currency?: string | null;
}

export interface DashboardTrendPoint {
  label: string;
  bookings: number | null;
  completed: number | null;
  cancelled: number | null;
}

export interface DashboardChannelPoint {
  name: string;
  value: number;
  color: string | null;
}

export interface DashboardAppointmentSummary {
  id: string;
  customerName: string | null;
  serviceName: string | null;
  staffName: string | null;
  channelName: string | null;
  status: Appointment['status'] | string;
  startTime: string | null;
}

export interface DashboardSummary {
  generatedAt: string | null;
  metrics: DashboardSummaryMetric[];
  bookingTrend: DashboardTrendPoint[];
  channelDistribution: DashboardChannelPoint[];
  recentAppointments: DashboardAppointmentSummary[];
}

export interface SendConversationMessageInput {
  body: string;
  sender?: Message['sender'];
  direction?: Message['direction'];
}

function buildTenantSearchParams(scope: TenantScope, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams({
    organizationId: scope.organizationId,
    locationId: scope.locationId,
  });

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return params;
}

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

function formatPath(path: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (nextPath, [key, value]) => nextPath.replace(`:${key}`, encodeURIComponent(value)),
    path
  );
}

function readCollection<T>(response: unknown, keys: string[] = ['items', 'data', 'results']): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  const candidate = response as Record<string, unknown>;
  for (const key of keys) {
    const value = candidate[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  for (const value of Object.values(candidate)) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function readEntity<T>(response: unknown, keys: string[] = []): T | null {
  if (!response) {
    return null;
  }

  if (typeof response === 'object') {
    const candidate = response as Record<string, unknown>;
    for (const key of keys) {
      const value = candidate[key];
      if (value && typeof value === 'object') {
        return value as T;
      }
    }

    if ('id' in candidate) {
      return response as T;
    }
  }

  return null;
}

function readOptionalText(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function readOptionalNumber(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readOptionalFiniteNumber(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readOptionalTrend(candidate: Record<string, unknown>, keys: string[]) {
  const trend = readOptionalText(candidate, keys);
  if (trend === 'up' || trend === 'down' || trend === 'flat') {
    return trend;
  }

  return null;
}

function normalizeDashboardMetric(item: unknown): DashboardSummaryMetric | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const label = readOptionalText(candidate, ['label', 'name', 'title']);
  if (!label) {
    return null;
  }

  const key = readOptionalText(candidate, ['key', 'id', 'slug']) ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const format = readOptionalText(candidate, ['format', 'type']);

  return {
    key,
    label,
    value: readOptionalFiniteNumber(candidate, ['value', 'amount', 'count', 'total', 'current', 'currentValue']),
    format:
      format === 'percent' || format === 'currency' || format === 'duration' || format === 'text'
        ? format
        : 'number',
    delta: readOptionalFiniteNumber(candidate, ['delta', 'change', 'difference']),
    deltaLabel: readOptionalText(candidate, ['deltaLabel', 'changeLabel', 'trendLabel', 'subtitle']),
    trend: readOptionalTrend(candidate, ['trend', 'direction']),
    currency: readOptionalText(candidate, ['currency']),
  };
}

function normalizeDashboardMetrics(source: unknown): DashboardSummaryMetric[] {
  if (Array.isArray(source)) {
    return source.map(normalizeDashboardMetric).filter((item): item is DashboardSummaryMetric => item !== null);
  }

  if (!source || typeof source !== 'object') {
    return [];
  }

  const candidate = source as Record<string, unknown>;
  const metricsArray = readCollection<unknown>(candidate, ['metrics', 'kpis', 'stats']);
  if (metricsArray.length > 0) {
    return metricsArray.map(normalizeDashboardMetric).filter((item): item is DashboardSummaryMetric => item !== null);
  }

  const definitions: Array<{ key: string; label: string; format: DashboardSummaryMetric['format']; keys: string[] }> = [
    { key: 'totalBookings', label: 'Total Bookings', format: 'number', keys: ['totalBookings', 'bookingsTotal', 'totalAppointments', 'appointmentsTotal'] },
    { key: 'todayBookings', label: "Today's Schedule", format: 'number', keys: ['todayBookings', 'appointmentsToday', 'todayAppointments', 'scheduleToday'] },
    { key: 'newMessages', label: 'New Messages', format: 'number', keys: ['newMessages', 'unreadMessages', 'unreadConversations', 'newConversations'] },
    { key: 'pendingReminders', label: 'Pending Reminders', format: 'number', keys: ['pendingReminders', 'remindersPending', 'scheduledReminders'] },
    { key: 'conversionRate', label: 'Conversion Rate', format: 'percent', keys: ['conversionRate', 'bookingConversionRate'] },
    { key: 'avgResponseTime', label: 'Avg. Response Time', format: 'duration', keys: ['avgResponseTime', 'avgResponseTimeMinutes', 'averageResponseTimeMinutes'] },
    { key: 'revenue', label: 'Revenue', format: 'currency', keys: ['revenue', 'totalRevenue', 'grossRevenue'] },
  ];

  return definitions
    .map((definition) => {
      const value = readOptionalFiniteNumber(candidate, definition.keys);
      if (value === null) {
        return null;
      }

      const metric: DashboardSummaryMetric = {
        key: definition.key,
        label: definition.label,
        value: value as number | null,
        format: definition.format,
        delta: readOptionalFiniteNumber(candidate, [`${definition.key}Delta`, `${definition.key}Change`, `${definition.key}Difference`]),
        deltaLabel: readOptionalText(candidate, [`${definition.key}DeltaLabel`, `${definition.key}ChangeLabel`]),
        trend: readOptionalTrend(candidate, [`${definition.key}Trend`, `${definition.key}Direction`]),
        currency: readOptionalText(candidate, ['currency']),
      };

      return metric;
    })
    .filter((item): item is DashboardSummaryMetric => item !== null);
}

function normalizeDashboardTrendPoint(item: unknown): DashboardTrendPoint | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const label = readOptionalText(candidate, ['label', 'name', 'day', 'date', 'weekDay']);
  if (!label) {
    return null;
  }

  return {
    label,
    bookings: readOptionalFiniteNumber(candidate, ['bookings', 'value', 'count', 'total']),
    completed: readOptionalFiniteNumber(candidate, ['completed', 'completedBookings', 'success', 'done']),
    cancelled: readOptionalFiniteNumber(candidate, ['cancelled', 'canceled', 'cancelledBookings', 'failed']),
  };
}

function normalizeDashboardChannelPoint(item: unknown): DashboardChannelPoint | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const name = readOptionalText(candidate, ['name', 'label', 'channel', 'channelName']);
  if (!name) {
    return null;
  }

  const value = readOptionalFiniteNumber(candidate, ['value', 'count', 'total', 'bookings']);
  if (value === null) {
    return null;
  }

  return {
    name,
    value,
    color: readOptionalText(candidate, ['color', 'fill']),
  };
}

function normalizeDashboardAppointment(item: unknown): DashboardAppointmentSummary | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const appointment = readEntity<Appointment>(candidate, ['appointment']) ?? ('id' in candidate ? (candidate as unknown as Appointment) : null);

  if (!appointment) {
    return null;
  }

  const customer = readEntity<Customer>(candidate, ['customer']);
  const service = readEntity<Service>(candidate, ['service']);
  const staff = readEntity<Staff>(candidate, ['staff']);
  const channel = readEntity<Channel>(candidate, ['channel']);

  return {
    id: appointment.id,
    customerName:
      readOptionalText(candidate, ['customerName', 'customer_name']) ?? customer?.name ?? null,
    serviceName:
      readOptionalText(candidate, ['serviceName', 'service_name']) ?? service?.name ?? null,
    staffName:
      readOptionalText(candidate, ['staffName', 'staff_name']) ?? staff?.name ?? null,
    channelName:
      readOptionalText(candidate, ['channelName', 'channel_name']) ?? channel?.name ?? null,
    status: readOptionalText(candidate, ['status']) ?? appointment.status,
    startTime:
      readOptionalText(candidate, ['startTime', 'scheduledFor', 'time']) ?? appointment.startTime ?? null,
  };
}

function normalizeDashboardAppointments(source: unknown) {
  if (!source) {
    return [];
  }

  const items = readCollection<unknown>(source, ['recentAppointments', 'appointments', 'items', 'data', 'results', 'recentRecords']);
  return items
    .map(normalizeDashboardAppointment)
    .filter((item): item is DashboardAppointmentSummary => item !== null);
}

function normalizeDashboardSummary(response: unknown): DashboardSummary | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const candidate = readEntity<Record<string, unknown>>(response, ['summary', 'dashboard', 'data']) ?? (response as Record<string, unknown>);
  const bookingTrendSource =
    candidate.bookingTrend
    ?? candidate.bookingsTrend
    ?? candidate.bookingsByDay
    ?? candidate.bookingsOverTime
    ?? candidate.dailyBookings
    ?? candidate.trend
    ?? candidate.bookings;
  const channelDistributionSource =
    candidate.channelDistribution
    ?? candidate.channelBreakdown
    ?? candidate.channelMix
    ?? candidate.channels;
  const appointmentsSource =
    candidate.recentAppointments
    ?? candidate.recentBookings
    ?? candidate.recentRecords
    ?? candidate.latestAppointments
    ?? candidate.appointments
    ?? candidate.records;

  const bookingTrend = readCollection<unknown>(bookingTrendSource, ['items', 'data', 'results'])
    .map(normalizeDashboardTrendPoint)
    .filter((item): item is DashboardTrendPoint => item !== null);
  const channelDistribution = readCollection<unknown>(channelDistributionSource, ['items', 'data', 'results'])
    .map(normalizeDashboardChannelPoint)
    .filter((item): item is DashboardChannelPoint => item !== null);

  return {
    generatedAt:
      readOptionalText(candidate, ['generatedAt', 'updatedAt', 'asOf', 'timestamp']) ?? null,
    metrics: normalizeDashboardMetrics(candidate.metrics ?? candidate.kpis ?? candidate.stats ?? candidate),
    bookingTrend,
    channelDistribution,
    recentAppointments: normalizeDashboardAppointments(appointmentsSource),
  };
}

export async function fetchDashboardSummary(scope: TenantScope) {
  const response = await apiRequest<unknown>(withQuery('/api/dashboard/summary', buildTenantSearchParams(scope)), {
    method: 'GET',
  });
  return normalizeDashboardSummary(response);
}

async function requestCollection<T>(
  path: string,
  scope: TenantScope,
  extraQuery: Record<string, string | number | undefined> = {},
  keys: string[] = ['items', 'data', 'results']
) {
  const response = await apiRequest<unknown>(withQuery(path, buildTenantSearchParams(scope, extraQuery)), {
    method: 'GET',
  });
  return readCollection<T>(response, keys);
}

async function requestEntity<T>(path: string, options: { method: 'POST' | 'PATCH' | 'DELETE'; body?: unknown }) {
  const response = await apiRequest<unknown>(path, options);
  return readEntity<T>(response, [
    'settings',
    'channel',
    'conversation',
    'message',
    'auditLog',
    'service',
    'staff',
    'appointment',
    'customer',
    'hours',
    'businessHours',
    'staffHours',
  ]);
}

function readSettings<T>(response: unknown) {
  return readEntity<T>(response, ['settings']);
}

function normalizeConversationSummary(item: unknown): ConversationThreadSummary | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const conversation = readEntity<Conversation>(item, ['conversation']) ?? ('id' in candidate ? (item as Conversation) : null);

  if (!conversation) {
    return null;
  }

  const customer = readEntity<Customer>(candidate, ['customer']);
  const channel = readEntity<Channel>(candidate, ['channel']);

  return {
    ...conversation,
    customerName:
      readOptionalText(candidate, ['customerName', 'customer_name']) ?? customer?.name ?? null,
    customerPhone:
      readOptionalText(candidate, ['customerPhone', 'customer_phone']) ?? customer?.phone ?? null,
    channelName:
      readOptionalText(candidate, ['channelName', 'channel_name']) ?? channel?.name ?? null,
    channelType:
      (readOptionalText(candidate, ['channelType', 'channel_type']) as Channel['type'] | null)
      ?? channel?.type
      ?? null,
    channelDisplayPhoneNumber:
      readOptionalText(candidate, ['channelDisplayPhoneNumber', 'channel_display_phone_number']) ?? channel?.displayPhoneNumber ?? null,
    lastMessagePreview:
      readOptionalText(candidate, ['lastMessagePreview', 'last_message_preview', 'preview', 'messagePreview']) ?? null,
    unreadCount:
      readOptionalNumber(candidate, ['unreadCount', 'unreadMessages', 'unread']) ?? null,
  };
}

function normalizeConversationDetail(response: unknown): ConversationThreadDetail | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const candidate = response as Record<string, unknown>;
  const conversation = readEntity<Conversation>(response, ['conversation', 'item', 'data']) ?? ('id' in candidate ? (response as Conversation) : null);

  if (!conversation) {
    return null;
  }

  const nested = candidate.thread && typeof candidate.thread === 'object' ? (candidate.thread as Record<string, unknown>) : candidate;

  return {
    conversation,
    customer: readEntity<Customer>(nested, ['customer']) ?? readEntity<Customer>(candidate, ['customer']),
    channel: readEntity<Channel>(nested, ['channel']) ?? readEntity<Channel>(candidate, ['channel']),
    messages: readCollection<Message>(nested, ['messages', 'items', 'data']),
  };
}

export function mapServiceStaffFromAppointments(
  serviceId: string,
  appointments: Appointment[],
  staffById: Map<string, Staff>
): string[] {
  const names = new Set<string>();

  for (const appointment of appointments) {
    if (appointment.serviceId !== serviceId) {
      continue;
    }

    const staff = staffById.get(appointment.staffId);
    if (staff) {
      names.add(staff.name);
    }
  }

  return Array.from(names);
}

export function mapStaffServicesFromAppointments(
  staffId: string,
  appointments: Appointment[],
  servicesById: Map<string, Service>
): string[] {
  const names = new Set<string>();

  for (const appointment of appointments) {
    if (appointment.staffId !== staffId) {
      continue;
    }

    const service = servicesById.get(appointment.serviceId);
    if (service) {
      names.add(service.name);
    }
  }

  return Array.from(names);
}

export function buildBusinessHourSeed() {
  return [
    { weekday: 1, active: true, openTime: '09:00', closeTime: '17:00' },
    { weekday: 2, active: true, openTime: '09:00', closeTime: '17:00' },
    { weekday: 3, active: true, openTime: '09:00', closeTime: '17:00' },
    { weekday: 4, active: true, openTime: '09:00', closeTime: '17:00' },
    { weekday: 5, active: true, openTime: '09:00', closeTime: '17:00' },
    { weekday: 6, active: true, openTime: '10:00', closeTime: '15:00' },
    { weekday: 0, active: false, openTime: '09:00', closeTime: '17:00' },
  ] as const;
}

export function mergeBusinessHours(_scope: TenantScope, hours: BusinessHour[]) {
  const fallback = buildBusinessHourSeed();
  return fallback.map((seed) => {
    const existing = hours.find((hour) => hour.weekday === seed.weekday);
    return existing
      ? {
          weekday: existing.weekday,
          active: existing.active,
          openTime: existing.openTime,
          closeTime: existing.closeTime,
        }
      : seed;
  });
}

export async function fetchServices(scope: TenantScope) {
  return requestCollection<Service>('/api/services', scope, {}, ['items', 'services', 'data']);
}

export async function createService(scope: TenantScope, input: Record<string, unknown>) {
  const response = await requestEntity<Service>('/api/services', {
    method: 'POST',
    body: { ...scope, ...input },
  });
  return response;
}

export async function updateService(scope: TenantScope, serviceId: string, input: Record<string, unknown>) {
  const response = await requestEntity<Service>(formatPath('/api/services/:serviceId', { serviceId }), {
    method: 'PATCH',
    body: { ...scope, ...input },
  });
  return response;
}

export async function deleteService(scope: TenantScope, serviceId: string) {
  const response = await apiRequest<unknown>(withQuery(formatPath('/api/services/:serviceId', { serviceId }), buildTenantSearchParams(scope)), {
    method: 'DELETE',
  });
  return readEntity<Service>(response, ['service']);
}

export async function fetchStaff(scope: TenantScope) {
  return requestCollection<Staff>('/api/staff', scope, {}, ['items', 'staff', 'data']);
}

export async function createStaff(scope: TenantScope, input: Record<string, unknown>) {
  return requestEntity<Staff>('/api/staff', {
    method: 'POST',
    body: { ...scope, ...input },
  });
}

export async function updateStaff(scope: TenantScope, staffId: string, input: Record<string, unknown>) {
  return requestEntity<Staff>(formatPath('/api/staff/:staffId', { staffId }), {
    method: 'PATCH',
    body: { ...scope, ...input },
  });
}

export async function deleteStaff(scope: TenantScope, staffId: string) {
  const response = await apiRequest<unknown>(withQuery(formatPath('/api/staff/:staffId', { staffId }), buildTenantSearchParams(scope)), {
    method: 'DELETE',
  });
  return readEntity<Staff>(response, ['staff']);
}

export async function fetchStaffServices(scope: TenantScope, staffId: string) {
  return requestCollection<StaffService>(formatPath('/api/staff/:staffId/services', { staffId }), scope, {}, [
    'items',
    'assignments',
    'staffServices',
    'data',
  ]);
}

export async function assignStaffService(
  scope: TenantScope,
  staffId: string,
  input: Pick<StaffService, 'serviceId' | 'active'>
) {
  return requestEntity<StaffService>(formatPath('/api/staff/:staffId/services', { staffId }), {
    method: 'POST',
    body: { ...scope, assignment: input },
  });
}

export async function fetchAppointments(scope: TenantScope) {
  return requestCollection<Appointment>('/api/appointments', scope, {}, ['items', 'appointments', 'data']);
}

export async function createAppointment(scope: TenantScope, input: Record<string, unknown>) {
  return requestEntity<Appointment>('/api/appointments', {
    method: 'POST',
    body: { ...scope, ...input },
  });
}

export async function updateAppointment(scope: TenantScope, appointmentId: string, input: Record<string, unknown>) {
  return requestEntity<Appointment>(formatPath('/api/appointments/:appointmentId', { appointmentId }), {
    method: 'PATCH',
    body: { ...scope, ...input },
  });
}

export async function cancelAppointment(scope: TenantScope, appointmentId: string) {
  await apiRequest<void>(
    withQuery(formatPath('/api/appointments/:appointmentId/cancel', { appointmentId }), buildTenantSearchParams(scope)),
    { method: 'POST', body: {} }
  );
}

export async function rescheduleAppointment(scope: TenantScope, appointmentId: string, input: Record<string, unknown>) {
  await apiRequest<void>(formatPath('/api/appointments/:appointmentId/reschedule', { appointmentId }), {
    method: 'POST',
    body: { ...scope, ...input },
  });
}

export async function fetchCustomers(scope: TenantScope) {
  return requestCollection<Customer>('/api/customers', scope, {}, ['items', 'customers', 'data']);
}

export async function fetchBusinessHours(scope: TenantScope) {
  return requestCollection<BusinessHour>('/api/availability/business-hours', scope, {}, ['items', 'businessHours', 'hours', 'data']);
}

export async function replaceBusinessHours(
  scope: TenantScope,
  hours: Array<Pick<BusinessHour, 'weekday' | 'openTime' | 'closeTime' | 'active'>>
) {
  const response = await apiRequest<unknown>('/api/availability/business-hours', {
    method: 'PUT',
    body: {
      ...scope,
      hours,
    },
  });
  return readCollection<BusinessHour>(response, ['items', 'businessHours', 'hours', 'data']);
}

export async function fetchStaffHours(scope: TenantScope, staffId: string) {
  return requestCollection<StaffHour>(formatPath('/api/availability/staff-hours/:staffId', { staffId }), scope, {}, [
    'items',
    'staffHours',
    'hours',
    'data',
  ]);
}

export async function fetchConversations(scope: TenantScope) {
  const response = await apiRequest<unknown>(withQuery('/api/conversations', buildTenantSearchParams(scope)), {
    method: 'GET',
  });
  return readCollection<unknown>(response, ['items', 'conversations', 'data'])
    .map(normalizeConversationSummary)
    .filter((item): item is ConversationThreadSummary => item !== null);
}

export async function fetchConversationDetail(scope: TenantScope, conversationId: string) {
  const response = await apiRequest<unknown>(
    withQuery(formatPath('/api/conversations/:conversationId', { conversationId }), buildTenantSearchParams(scope)),
    {
      method: 'GET',
    }
  );
  return normalizeConversationDetail(response);
}

export async function fetchConversationMessages(scope: TenantScope, conversationId: string) {
  const response = await apiRequest<unknown>(
    withQuery(formatPath('/api/conversations/:conversationId/messages', { conversationId }), buildTenantSearchParams(scope)),
    {
      method: 'GET',
    }
  );
  return readCollection<Message>(response, ['items', 'messages', 'data']);
}

export async function sendConversationMessage(
  scope: TenantScope,
  conversationId: string,
  input: SendConversationMessageInput
) {
  const response = await apiRequest<unknown>(
    withQuery(formatPath('/api/conversations/:conversationId/messages', { conversationId }), buildTenantSearchParams(scope)),
    {
      method: 'POST',
      body: { ...scope, ...input },
    }
  );
  return readEntity<Message>(response, ['message', 'item', 'data']);
}

export async function takeoverConversation(scope: TenantScope, conversationId: string) {
  const response = await apiRequest<unknown>(
    withQuery(formatPath('/api/conversations/:conversationId/takeover', { conversationId }), buildTenantSearchParams(scope)),
    {
      method: 'POST',
      body: scope,
    }
  );
  return normalizeConversationDetail(response);
}

export async function closeConversation(scope: TenantScope, conversationId: string) {
  const response = await apiRequest<unknown>(
    withQuery(formatPath('/api/conversations/:conversationId/close', { conversationId }), buildTenantSearchParams(scope)),
    {
      method: 'POST',
      body: scope,
    }
  );
  return normalizeConversationDetail(response);
}

export async function fetchChannels(scope: TenantScope) {
  return requestCollection<Channel>('/api/channels', scope, {}, ['items', 'channels', 'data']);
}

export async function fetchAiSettings(scope: TenantScope) {
  const response = await apiRequest<unknown>(withQuery('/api/ai-settings', buildTenantSearchParams(scope)), {
    method: 'GET',
  });
  return readSettings<AiSettings>(response);
}

export async function updateAiSettings(scope: TenantScope, input: Partial<AiSettings>) {
  const response = await apiRequest<unknown>('/api/ai-settings', {
    method: 'PATCH',
    body: {
      ...scope,
      settings: input,
    },
  });
  return readSettings<AiSettings>(response);
}

export interface AiReceptionistToolCallInput {
  type: 'createAppointment';
  customerId: string;
  serviceId: string;
  staffId: string;
  channelId?: string;
  conversationId?: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  intent?: string | null;
}

export interface AiReceptionistRunInput {
  conversationId: string;
  message: string;
  intent?: string;
  toolCall?: Partial<AiReceptionistToolCallInput>;
}

export interface AiReceptionistRunResult {
  settings: AiSettings;
  assistantMessage: string;
  appointment: Appointment | null;
  conversation: Conversation;
  message: Message | null;
  auditLog: AuditLog;
}

export async function runAiReceptionist(scope: TenantScope, input: AiReceptionistRunInput) {
  return apiRequest<AiReceptionistRunResult>('/api/ai/receptionist/run', {
    method: 'POST',
    body: {
      ...scope,
      ...input,
    },
  });
}
