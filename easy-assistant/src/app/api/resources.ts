import type {
  Appointment,
  BusinessHour,
  Customer,
  Service,
  Staff,
  StaffHour,
} from '../types';
import { apiRequest } from './client';

export interface TenantScope {
  organizationId: string;
  locationId: string;
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
  return readEntity<T>(response, ['service', 'staff', 'appointment', 'customer', 'hours', 'businessHours', 'staffHours']);
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
  await apiRequest<void>(withQuery(formatPath('/api/services/:serviceId', { serviceId }), buildTenantSearchParams(scope)), {
    method: 'DELETE',
  });
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
  await apiRequest<void>(withQuery(formatPath('/api/staff/:staffId', { staffId }), buildTenantSearchParams(scope)), {
    method: 'DELETE',
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

export async function fetchStaffHours(scope: TenantScope, staffId: string) {
  return requestCollection<StaffHour>(formatPath('/api/availability/staff-hours/:staffId', { staffId }), scope, {}, [
    'items',
    'staffHours',
    'hours',
    'data',
  ]);
}
