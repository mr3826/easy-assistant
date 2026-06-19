import { generateId } from './crypto.mjs';
import {
  generateAvailableSlots,
  findAppointmentConflict,
  assertValidAppointmentWindow,
  BLOCKING_APPOINTMENT_STATUSES,
} from './availability.mjs';
import {
  serializeAppointment,
  serializeBusinessHour,
  serializeCustomer,
  serializeLocation,
  serializeService,
  serializeStaff,
  serializeStaffHour,
  serializeStaffService,
} from './serializers.mjs';

export function createPhase2Service(repository) {
  return {
    listServices(scope) {
      return page(repository.listServices(scope).map(serializeService));
    },

    getService(scope, serviceId) {
      return { service: requireScopedResource(serializeService(repository.findServiceById(serviceId)), scope, 'service') };
    },

    createService(scope, input) {
      const now = Date.now();
      const service = repository.createService({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        name: requireText(input.name, 'Service name is required.'),
        category: normalizeNullableText(input.category),
        description: normalizeNullableText(input.description),
        durationMinutes: requirePositiveInteger(input.durationMinutes, 'durationMinutes'),
        bufferMinutes: normalizeOptionalInteger(input.bufferMinutes, 0),
        price: normalizeOptionalNumber(input.price, 0),
        currency: normalizeText(input.currency ?? 'BDT'),
        active: input.active !== false,
        createdAt: now,
        updatedAt: now,
      });
      return { service: serializeService(service) };
    },

    updateService(scope, serviceId, input) {
      const now = Date.now();
      const current = requireScopedResource(serializeService(repository.findServiceById(serviceId)), scope, 'service');
      const service = repository.updateService(serviceId, {
        name: input.name !== undefined ? requireText(input.name, 'Service name is required.') : current.name,
        category: input.category !== undefined ? normalizeNullableText(input.category) : current.category,
        description: input.description !== undefined ? normalizeNullableText(input.description) : current.description,
        durationMinutes:
          input.durationMinutes !== undefined
            ? requirePositiveInteger(input.durationMinutes, 'durationMinutes')
            : current.durationMinutes,
        bufferMinutes:
          input.bufferMinutes !== undefined ? normalizeOptionalInteger(input.bufferMinutes, current.bufferMinutes) : current.bufferMinutes,
        price: input.price !== undefined ? normalizeOptionalNumber(input.price, current.price) : current.price,
        currency: input.currency !== undefined ? normalizeText(input.currency) : current.currency,
        active: input.active !== undefined ? Boolean(input.active) : current.active,
        updatedAt: now,
      });
      return { service: serializeService(service) };
    },

    deleteService(scope, serviceId) {
      requireScopedResource(serializeService(repository.findServiceById(serviceId)), scope, 'service');
      const service = repository.deactivateService(serviceId, Date.now());
      return { service: serializeService(service) };
    },

    listStaff(scope) {
      return page(repository.listStaff(scope).map(serializeStaff));
    },

    getStaff(scope, staffId) {
      return { staff: requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff') };
    },

    createStaff(scope, input) {
      const now = Date.now();
      const staff = repository.createStaff({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        name: requireText(input.name, 'Staff name is required.'),
        roleTitle: normalizeNullableText(input.roleTitle),
        email: normalizeNullableText(input.email),
        phone: normalizeNullableText(input.phone),
        avatarUrl: normalizeNullableText(input.avatarUrl),
        active: input.active !== false,
        createdAt: now,
        updatedAt: now,
      });
      return { staff: serializeStaff(staff) };
    },

    updateStaff(scope, staffId, input) {
      const now = Date.now();
      const current = requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      const staff = repository.updateStaff(staffId, {
        name: input.name !== undefined ? requireText(input.name, 'Staff name is required.') : current.name,
        roleTitle: input.roleTitle !== undefined ? normalizeNullableText(input.roleTitle) : current.roleTitle,
        email: input.email !== undefined ? normalizeNullableText(input.email) : current.email,
        phone: input.phone !== undefined ? normalizeNullableText(input.phone) : current.phone,
        avatarUrl: input.avatarUrl !== undefined ? normalizeNullableText(input.avatarUrl) : current.avatarUrl,
        active: input.active !== undefined ? Boolean(input.active) : current.active,
        updatedAt: now,
      });
      return { staff: serializeStaff(staff) };
    },

    deleteStaff(scope, staffId) {
      requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      const staff = repository.deactivateStaff(staffId, Date.now());
      return { staff: serializeStaff(staff) };
    },

    listStaffServices(scope, staffId) {
      requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      return page(repository.listStaffServicesForStaff(scope, staffId).map(serializeStaffService));
    },

    assignStaffService(scope, staffId, input) {
      requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      requireScopedResource(serializeService(repository.findServiceById(input.serviceId)), scope, 'service');
      const now = Date.now();
      const assignment = repository.upsertStaffService({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        staffId,
        serviceId: input.serviceId,
        active: input.active !== false,
        createdAt: now,
        updatedAt: now,
      });
      return { assignment: serializeStaffService(assignment) };
    },

    listAvailabilityBusinessHours(scope) {
      return page(repository.listBusinessHours(scope).map(serializeBusinessHour));
    },

    replaceAvailabilityBusinessHours(scope, input) {
      const now = Date.now();
      const hours = repository.replaceBusinessHours(
        scope,
        normalizeHours(input.hours, 'business hours', (hour) => ({
          weekday: requireWeekday(hour.weekday),
          openTime: requireTimeOfDay(hour.openTime, 'openTime'),
          closeTime: requireTimeOfDay(hour.closeTime, 'closeTime'),
          active: hour.active !== false,
        })),
        { createdAt: now, updatedAt: now },
      );
      return { items: hours.map(serializeBusinessHour), nextCursor: null };
    },

    listStaffHours(scope, staffId) {
      requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      return page(repository.listStaffHours(scope, staffId).map(serializeStaffHour));
    },

    replaceStaffHours(scope, staffId, input) {
      requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');
      const now = Date.now();
      const hours = repository.replaceStaffHours(
        scope,
        staffId,
        normalizeHours(input.hours, 'staff hours', (hour) => ({
          weekday: requireWeekday(hour.weekday),
          startTime: requireTimeOfDay(hour.startTime, 'startTime'),
          endTime: requireTimeOfDay(hour.endTime, 'endTime'),
          active: hour.active !== false,
        })),
        { createdAt: now, updatedAt: now },
      );
      return { items: hours.map(serializeStaffHour), nextCursor: null };
    },

    listCustomers(scope) {
      return page(repository.listCustomers(scope).map(serializeCustomer));
    },

    getCustomer(scope, customerId) {
      return { customer: requireScopedResource(serializeCustomer(repository.findCustomerById(customerId)), scope, 'customer') };
    },

    createCustomer(scope, input) {
      const now = Date.now();
      const customer = repository.createCustomer({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        name: normalizeNullableText(input.name),
        phone: requireText(input.phone, 'Customer phone is required.'),
        email: normalizeNullableText(input.email),
        sourceChannel: normalizeText(input.sourceChannel ?? 'manual'),
        consentStatus: normalizeText(input.consentStatus ?? 'unknown'),
        lastSeenAt: parseOptionalIsoDateTime(input.lastSeenAt),
        active: input.active !== false,
        createdAt: now,
        updatedAt: now,
      });
      return { customer: serializeCustomer(customer) };
    },

    updateCustomer(scope, customerId, input) {
      const now = Date.now();
      const current = requireScopedResource(serializeCustomer(repository.findCustomerById(customerId)), scope, 'customer');
      const customer = repository.updateCustomer(customerId, {
        name: input.name !== undefined ? normalizeNullableText(input.name) : current.name,
        phone: input.phone !== undefined ? requireText(input.phone, 'Customer phone is required.') : current.phone,
        email: input.email !== undefined ? normalizeNullableText(input.email) : current.email,
        sourceChannel: input.sourceChannel !== undefined ? normalizeText(input.sourceChannel) : current.sourceChannel,
        consentStatus: input.consentStatus !== undefined ? normalizeText(input.consentStatus) : current.consentStatus,
        lastSeenAt: input.lastSeenAt !== undefined ? parseOptionalIsoDateTime(input.lastSeenAt) : current.lastSeenAt,
        active: input.active !== undefined ? Boolean(input.active) : current.active,
        updatedAt: now,
      });
      return { customer: serializeCustomer(customer) };
    },

    deleteCustomer(scope, customerId) {
      requireScopedResource(serializeCustomer(repository.findCustomerById(customerId)), scope, 'customer');
      const customer = repository.deactivateCustomer(customerId, Date.now());
      return { customer: serializeCustomer(customer) };
    },

    listAppointments(scope) {
      return page(repository.listAppointments(scope).map(serializeAppointment));
    },

    getAppointment(scope, appointmentId) {
      return {
        appointment: requireScopedResource(serializeAppointment(repository.findAppointmentById(appointmentId)), scope, 'appointment'),
      };
    },

    createAppointment(scope, input) {
      const now = Date.now();
      const service = requireScopedResource(serializeService(repository.findServiceById(input.serviceId)), scope, 'service');
      const staff = requireScopedResource(serializeStaff(repository.findStaffById(input.staffId)), scope, 'staff');
      const customer = requireScopedResource(serializeCustomer(repository.findCustomerById(input.customerId)), scope, 'customer');
      const assignment = repository
        .listStaffServicesForStaff(scope, staff.id)
        .find((row) => row.service_id === service.id && row.active);
      if (!assignment) {
        throw makeHttpError(409, 'staff_service_unavailable', 'The selected staff member is not assigned to that service.');
      }

      const startTime = requireIsoDateTime(input.startTime, 'startTime');
      const endTime = requireIsoDateTime(input.endTime, 'endTime');
      assertValidAppointmentWindow(startTime, endTime);

      const candidate = {
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        staffId: staff.id,
        startTime,
        endTime,
      };
      const conflict = findAppointmentConflict(candidate, repository.listAppointments(scope).map(serializeAppointment));
      if (conflict.conflicts) {
        throw makeHttpError(409, 'appointment_conflict', 'The selected time overlaps an existing booking.');
      }

      const appointment = repository.createAppointment({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        customerId: customer.id,
        serviceId: service.id,
        staffId: staff.id,
        channelId: normalizeNullableText(input.channelId),
        conversationId: normalizeNullableText(input.conversationId),
        startTime: toEpoch(startTime),
        endTime: toEpoch(endTime),
        status: normalizeText(input.status ?? 'pending'),
        notes: normalizeNullableText(input.notes),
        createdBy: normalizeText(input.createdBy ?? 'manual'),
        createdAt: now,
        updatedAt: now,
      });
      return { appointment: serializeAppointment(appointment) };
    },

    updateAppointment(scope, appointmentId, input) {
      const now = Date.now();
      const current = requireScopedResource(serializeAppointment(repository.findAppointmentById(appointmentId)), scope, 'appointment');
      const next = {
        customerId: input.customerId !== undefined ? input.customerId : current.customerId,
        serviceId: input.serviceId !== undefined ? input.serviceId : current.serviceId,
        staffId: input.staffId !== undefined ? input.staffId : current.staffId,
        channelId: input.channelId !== undefined ? normalizeNullableText(input.channelId) : current.channelId,
        conversationId: input.conversationId !== undefined ? normalizeNullableText(input.conversationId) : current.conversationId,
        startTime: input.startTime !== undefined ? requireIsoDateTime(input.startTime, 'startTime') : current.startTime,
        endTime: input.endTime !== undefined ? requireIsoDateTime(input.endTime, 'endTime') : current.endTime,
        status: input.status !== undefined ? normalizeText(input.status) : current.status,
        notes: input.notes !== undefined ? normalizeNullableText(input.notes) : current.notes,
        createdBy: input.createdBy !== undefined ? normalizeText(input.createdBy) : current.createdBy,
        updatedAt: now,
      };

      assertValidAppointmentWindow(next.startTime, next.endTime);
      ensureAppointmentScope(repository, scope, next.customerId, next.serviceId, next.staffId);
      assertNoAppointmentConflict(repository, scope, appointmentId, next.staffId, next.startTime, next.endTime);

      const appointment = repository.updateAppointment(appointmentId, {
        ...next,
        startTime: toEpoch(next.startTime),
        endTime: toEpoch(next.endTime),
      });
      return { appointment: serializeAppointment(appointment) };
    },

    updateAppointmentStatus(scope, appointmentId, status) {
      const current = requireScopedResource(serializeAppointment(repository.findAppointmentById(appointmentId)), scope, 'appointment');
      const appointment = repository.updateAppointmentStatus(appointmentId, normalizeText(status), Date.now());
      return { appointment: serializeAppointment(appointment ?? current) };
    },

    rescheduleAppointment(scope, appointmentId, input) {
      const now = Date.now();
      const current = requireScopedResource(serializeAppointment(repository.findAppointmentById(appointmentId)), scope, 'appointment');
      const startTime = requireIsoDateTime(input.startTime, 'startTime');
      const endTime = requireIsoDateTime(input.endTime, 'endTime');
      assertValidAppointmentWindow(startTime, endTime);

      const nextStaffId = input.staffId !== undefined ? input.staffId : current.staffId;
      ensureAppointmentScope(repository, scope, current.customerId, current.serviceId, nextStaffId);
      assertNoAppointmentConflict(repository, scope, appointmentId, nextStaffId, startTime, endTime);

      const appointment = repository.rescheduleAppointment(
        appointmentId,
        toEpoch(startTime),
        toEpoch(endTime),
        now,
        normalizeText(input.status ?? 'rescheduled'),
      );
      return { appointment: serializeAppointment(appointment) };
    },

    deleteAppointment(scope, appointmentId) {
      requireScopedResource(serializeAppointment(repository.findAppointmentById(appointmentId)), scope, 'appointment');
      const appointment = repository.cancelAppointment(appointmentId, Date.now(), null);
      return { appointment: serializeAppointment(appointment) };
    },

    getAvailabilitySlots(scope, input) {
      const service = requireScopedResource(serializeService(repository.findServiceById(input.serviceId)), scope, 'service');
      const location = serializeLocation(repository.findLocationById(scope.locationId));
      const staff = repository.listStaff(scope).map(serializeStaff);
      const staffServices = repository.listStaffServices(scope).map(serializeStaffService);
      const businessHours = repository.listBusinessHours(scope).map(serializeBusinessHour);
      const staffHours = input.staffId
        ? repository.listStaffHours(scope, input.staffId).map(serializeStaffHour)
        : repository
            .listStaff(scope)
            .flatMap((member) => repository.listStaffHours(scope, member.id).map(serializeStaffHour));
      const existingAppointments = repository.listAppointments(scope).map(serializeAppointment);
      const availability = generateAvailableSlots({
        date: requireIsoDate(input.date),
        timezone: location?.timezone ?? scope.timezone,
        service,
        staff,
        staffServices,
        businessHours,
        staffHours,
        existingAppointments,
        staffId: input.staffId,
      });

      return {
        date: availability.date,
        timezone: availability.timezone,
        slots: availability.slots,
      };
    },
  };
}

export function makeHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function page(items) {
  return { items, nextCursor: null };
}

function normalizeNullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function requireText(value, message) {
  const text = normalizeText(value);
  if (!text) {
    throw makeHttpError(400, 'invalid_input', message);
  }
  return text;
}

function requirePositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw makeHttpError(400, 'invalid_input', `${fieldName} must be a positive integer.`);
  }
  return number;
}

function normalizeOptionalInteger(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw makeHttpError(400, 'invalid_input', 'Expected a non-negative integer.');
  }
  return number;
}

function normalizeOptionalNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw makeHttpError(400, 'invalid_input', 'Expected a non-negative number.');
  }
  return number;
}

function requireWeekday(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 6) {
    throw makeHttpError(400, 'invalid_input', 'weekday must be between 0 and 6.');
  }
  return number;
}

function requireTimeOfDay(value, fieldName) {
  const text = requireText(value, `${fieldName} is required.`);
  const [hourPart, minutePart] = text.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw makeHttpError(400, 'invalid_input', `${fieldName} must be a valid HH:MM time.`);
  }
  return `${pad2(hour)}:${pad2(minute)}`;
}

function requireIsoDate(value) {
  const text = requireText(value, 'date is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw makeHttpError(400, 'invalid_input', 'date must be an ISO local date.');
  }
  return text;
}

function requireIsoDateTime(value, fieldName) {
  const text = requireText(value, `${fieldName} is required.`);
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) {
    throw makeHttpError(400, 'invalid_input', `${fieldName} must be a valid ISO date-time.`);
  }
  return new Date(parsed).toISOString();
}

function parseOptionalIsoDateTime(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return toEpoch(requireIsoDateTime(value, 'lastSeenAt'));
}

function toEpoch(isoDateTime) {
  return Date.parse(isoDateTime);
}

function requireScopedResource(resource, scope, label) {
  if (!resource) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (resource.organizationId !== scope.organizationId || resource.locationId !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (Object.prototype.hasOwnProperty.call(resource, 'active') && resource.active === false) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return resource;
}

function ensureAppointmentScope(repository, scope, customerId, serviceId, staffId) {
  requireScopedResource(serializeCustomer(repository.findCustomerById(customerId)), scope, 'customer');
  requireScopedResource(serializeService(repository.findServiceById(serviceId)), scope, 'service');
  requireScopedResource(serializeStaff(repository.findStaffById(staffId)), scope, 'staff');

  const assignment = repository
    .listStaffServicesForStaff(scope, staffId)
    .find((row) => row.service_id === serviceId && row.active);
  if (!assignment) {
    throw makeHttpError(409, 'staff_service_unavailable', 'The selected staff member is not assigned to that service.');
  }
}

function assertNoAppointmentConflict(repository, scope, ignoreAppointmentId, staffId, startTime, endTime) {
  const conflict = findAppointmentConflict(
    {
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      staffId,
      startTime,
      endTime,
    },
    repository.listAppointments(scope).map(serializeAppointment),
    { ignoreAppointmentId, blockingStatuses: BLOCKING_APPOINTMENT_STATUSES },
  );

  if (conflict.conflicts) {
    throw makeHttpError(409, 'appointment_conflict', 'The selected time overlaps an existing booking.');
  }
}

function normalizeHours(hours, label, mapper) {
  if (!Array.isArray(hours)) {
    throw makeHttpError(400, 'invalid_input', `${label} must be an array.`);
  }

  return hours.map(mapper);
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}
