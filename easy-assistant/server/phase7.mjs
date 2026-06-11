import { generateId } from './crypto.mjs';
import { withTransaction } from './db.mjs';
import {
  serializeAppointment,
  serializeChannel,
  serializeConversation,
  serializeCustomer,
  serializeMessage,
  serializeReminder,
  serializeReminderDelivery,
  serializeService,
  serializeStaff,
} from './serializers.mjs';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function createPhase7Service(repository) {
  return {
    syncAppointmentReminder(scope, appointment) {
      if (!appointment) {
        return { reminder: null, delivery: null };
      }

      return withTransaction(repository.db, () => syncAppointmentReminder(repository, scope, appointment));
    },

    listReminders(scope) {
      return page(repository.listReminders(scope).map(serializeReminder));
    },

    getReminder(scope, reminderId) {
      return {
        reminder: serializeReminder(requireScopedReminder(repository.findReminderById(reminderId), scope, 'reminder')),
      };
    },

    listReminderDeliveries(scope, reminderId) {
      requireScopedReminder(repository.findReminderById(reminderId), scope, 'reminder');
      return page(repository.listReminderDeliveries(scope, reminderId).map(serializeReminderDelivery));
    },

    getDashboardSummary(scope) {
      const now = Date.now();
      const appointments = repository.listAppointments(scope).map(serializeAppointment);
      const conversations = repository.listConversations(scope).map(serializeConversation);
      const channels = repository.listChannels(scope).map(serializeChannel);
      const reminders = repository.listReminders(scope).map(serializeReminder);
      const messages = conversations.flatMap((conversation) =>
        repository.listMessages(scope, conversation.id).map(serializeMessage),
      );

      const deliveries = reminders.flatMap((reminder) =>
        repository.listReminderDeliveries(scope, reminder.id).map(serializeReminderDelivery),
      );

      const customerIds = new Set(appointments.map((appointment) => appointment.customerId));
      const serviceIds = new Set(appointments.map((appointment) => appointment.serviceId));
      const staffIds = new Set(appointments.map((appointment) => appointment.staffId));

      const customers = new Map(
        Array.from(customerIds)
          .map((customerId) => repository.findCustomerById(customerId))
          .filter(Boolean)
          .map((row) => [row.id, serializeCustomer(row)]),
      );
      const services = new Map(
        Array.from(serviceIds)
          .map((serviceId) => repository.findServiceById(serviceId))
          .filter(Boolean)
          .map((row) => [row.id, serializeService(row)]),
      );
      const staffMembers = new Map(
        Array.from(staffIds)
          .map((staffId) => repository.findStaffById(staffId))
          .filter(Boolean)
          .map((row) => [row.id, serializeStaff(row)]),
      );
      const channelsById = new Map(channels.map((channel) => [channel.id, channel]));
      const conversationsById = new Map(conversations.map((conversation) => [conversation.id, conversation]));

      const appointmentsByDay = groupAppointmentsByDay(appointments).slice(-7);
      const bookingTrend = appointmentsByDay.map((day) => ({
        label: day.date,
        bookings: day.total,
        completed: day.completed,
        cancelled: day.cancelled,
      }));
      const channelBreakdown = buildChannelBreakdown({
        appointments,
        conversations,
        reminders,
        channelsById,
        conversationsById,
      });
      const channelDistribution = channelBreakdown.map((bucket) => ({
        name: bucket.channelName,
        value: bucket.appointments,
        color: resolveChannelColor(bucket.channelType, bucket.channelName),
      }));

      const recentMessageCount = countWhere(
        messages,
        (message) => message.direction === 'inbound' && Date.parse(message.sentAt) >= now - DAY_IN_MS,
      );
      const appointmentsUpcoming = countWhere(
        appointments,
        (appointment) => appointment.status === 'confirmed' && Date.parse(appointment.startTime) >= now,
      );
      const confirmedAppointments = countWhere(appointments, (appointment) => appointment.status === 'confirmed');
      const conversionRate = appointments.length > 0 ? Number(((confirmedAppointments / appointments.length) * 100).toFixed(1)) : 0;
      const revenueCurrency = services.values().next().value?.currency ?? 'BDT';
      const revenue = appointments.reduce((total, appointment) => {
        if (appointment.status !== 'confirmed' && appointment.status !== 'completed') {
          return total;
        }

        const service = services.get(appointment.serviceId);
        return total + (service?.price ?? 0);
      }, 0);

      const recentAppointments = appointments
        .slice()
        .sort((left, right) => Number(right.startTime ? Date.parse(right.startTime) : 0) - Number(left.startTime ? Date.parse(left.startTime) : 0))
        .slice(0, 5)
        .map((appointment) => ({
          ...appointment,
          customerName: customers.get(appointment.customerId)?.name ?? null,
          serviceName: services.get(appointment.serviceId)?.name ?? null,
          staffName: staffMembers.get(appointment.staffId)?.name ?? null,
          channelName: resolveAppointmentChannel(appointment, channelsById, conversationsById)?.name ?? null,
        }));

      return {
        generatedAt: new Date(now).toISOString(),
        metrics: {
          totalBookings: appointments.length,
          appointmentsTotal: appointments.length,
          appointmentsConfirmed: confirmedAppointments,
          appointmentsUpcoming,
          appointmentsToday: appointmentsUpcoming,
          todayBookings: appointmentsUpcoming,
          newMessages: recentMessageCount,
          conversationsTotal: conversations.length,
          conversationsActive: countWhere(conversations, (conversation) => conversation.state !== 'closed'),
          pendingReminders: countWhere(reminders, (reminder) => reminder.status === 'scheduled'),
          remindersTotal: reminders.length,
          remindersScheduled: countWhere(reminders, (reminder) => reminder.status === 'scheduled'),
          remindersCancelled: countWhere(reminders, (reminder) => reminder.status === 'cancelled'),
          reminderDeliveriesTotal: deliveries.length,
          conversionRate,
          revenue,
          currency: revenueCurrency,
        },
        bookingTrend,
        appointmentsByDay,
        channelDistribution,
        channelBreakdown,
        recentAppointments,
      };
    },
  };
}

function syncAppointmentReminder(repository, scope, appointment) {
  requireScopedAppointment(appointment, scope, 'appointment');

  const now = Date.now();
  const aiSettings = repository.findAiSettingsByScope(scope);
  const reminderEnabled = Boolean(aiSettings?.reminder_enabled);
  const existingReminder = repository.findReminderByAppointmentId(appointment.id);
  const appointmentStartEpoch = Date.parse(appointment.startTime);
  const desiredScheduledFor = clampScheduledFor(appointmentStartEpoch - DAY_IN_MS, now);
  const channelId = resolveChannelId(repository, scope, appointment, existingReminder);

  if (appointment.status === 'confirmed' && reminderEnabled && channelId) {
    const templateBody = buildReminderTemplate(repository, scope, appointment);
    const nextReminderState = {
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      appointmentId: appointment.id,
      channelId,
      scheduledFor: desiredScheduledFor,
      sentAt: null,
      status: 'scheduled',
      templateBody,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    };

    let reminder = existingReminder;
    let shouldLogDelivery = false;

    if (!existingReminder) {
      reminder = repository.createReminder({
        id: generateId(),
        ...nextReminderState,
      });
      shouldLogDelivery = true;
    } else {
      const needsResync =
        existingReminder.status !== 'scheduled' ||
        existingReminder.channel_id !== channelId ||
        Number(existingReminder.scheduled_for) !== desiredScheduledFor ||
        existingReminder.template_body !== templateBody ||
        existingReminder.failure_reason !== null;

      if (needsResync) {
        reminder = repository.updateReminder(existingReminder.id, {
          channelId,
          scheduledFor: desiredScheduledFor,
          sentAt: null,
          status: 'scheduled',
          templateBody,
          failureReason: null,
          updatedAt: now,
        });
        shouldLogDelivery = true;
      }
    }

    const delivery = shouldLogDelivery
      ? repository.createReminderDelivery({
          id: generateId(),
          organizationId: scope.organizationId,
          locationId: scope.locationId,
          reminderId: reminder.id,
          channelId,
          providerMessageId: null,
          status: 'scheduled',
          attemptedAt: now,
          responseMetadata: {
            event: 'scheduled',
            appointmentStatus: appointment.status,
            reminderEnabled,
          },
        })
      : null;

    return {
      reminder: reminder ? serializeReminder(reminder) : null,
      delivery: delivery ? serializeReminderDelivery(delivery) : null,
    };
  }

  if (existingReminder && existingReminder.status !== 'cancelled') {
    const reminder = repository.updateReminder(existingReminder.id, {
      channelId: channelId ?? existingReminder.channel_id,
      scheduledFor: Number(existingReminder.scheduled_for),
      sentAt: existingReminder.sent_at ?? null,
      status: 'cancelled',
      templateBody: existingReminder.template_body,
      failureReason: buildCancellationReason(appointment.status, reminderEnabled),
      updatedAt: now,
    });

    const delivery = repository.createReminderDelivery({
      id: generateId(),
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      reminderId: reminder.id,
      channelId: reminder.channel_id,
      providerMessageId: null,
      status: 'cancelled',
      attemptedAt: now,
      responseMetadata: {
        event: 'cancelled',
        appointmentStatus: appointment.status,
        reminderEnabled,
      },
    });

    return {
      reminder: serializeReminder(reminder),
      delivery: serializeReminderDelivery(delivery),
    };
  }

  return {
    reminder: existingReminder ? serializeReminder(existingReminder) : null,
    delivery: null,
  };
}

function buildReminderTemplate(repository, scope, appointment) {
  const customer = serializeCustomer(repository.findCustomerById(appointment.customerId));
  const service = serializeService(repository.findServiceById(appointment.serviceId));
  const staff = serializeStaff(repository.findStaffById(appointment.staffId));
  const customerLabel = customer?.name ?? 'the customer';
  const serviceLabel = service?.name ?? 'appointment';
  const staffLabel = staff?.name ? ` with ${staff.name}` : '';

  return `Reminder: ${customerLabel}, your ${serviceLabel}${staffLabel} is scheduled for ${appointment.startTime}.`;
}

function buildCancellationReason(status, reminderEnabled) {
  if (!reminderEnabled) {
    return 'reminders-disabled';
  }

  return `appointment-${status}`;
}

function resolveChannelId(repository, scope, appointment, existingReminder) {
  if (appointment.channelId) {
    return appointment.channelId;
  }

  if (existingReminder?.channel_id) {
    return existingReminder.channel_id;
  }

  if (appointment.conversationId) {
    const conversation = repository.findConversationById(appointment.conversationId);
    if (conversation && conversation.organization_id === scope.organizationId && conversation.location_id === scope.locationId) {
      return conversation.channel_id;
    }
  }

  return null;
}

function resolveAppointmentChannel(appointment, channelsById, conversationsById) {
  if (appointment.channelId) {
    return channelsById.get(appointment.channelId) ?? null;
  }

  if (appointment.conversationId) {
    const conversation = conversationsById.get(appointment.conversationId);
    if (conversation) {
      return channelsById.get(conversation.channelId) ?? null;
    }
  }

  return null;
}

function buildChannelBreakdown({ appointments, conversations, reminders, channelsById, conversationsById }) {
  const buckets = new Map();

  for (const appointment of appointments) {
    const channel = resolveAppointmentChannel(appointment, channelsById, conversationsById);
    const key = channel?.id ?? 'unknown';
    const bucket = buckets.get(key) ?? {
      channelId: channel?.id ?? null,
      channelName: channel?.name ?? 'Unknown',
      channelType: channel?.type ?? null,
      appointments: 0,
      conversations: 0,
      reminders: 0,
    };
    bucket.appointments += 1;
    buckets.set(key, bucket);
  }

  for (const conversation of conversations) {
    const channel = channelsById.get(conversation.channelId) ?? null;
    const key = channel?.id ?? conversation.channelId ?? 'unknown';
    const bucket = buckets.get(key) ?? {
      channelId: channel?.id ?? null,
      channelName: channel?.name ?? 'Unknown',
      channelType: channel?.type ?? null,
      appointments: 0,
      conversations: 0,
      reminders: 0,
    };
    bucket.conversations += 1;
    buckets.set(key, bucket);
  }

  for (const reminder of reminders) {
    const channel = channelsById.get(reminder.channelId) ?? null;
    const key = channel?.id ?? reminder.channelId ?? 'unknown';
    const bucket = buckets.get(key) ?? {
      channelId: channel?.id ?? null,
      channelName: channel?.name ?? 'Unknown',
      channelType: channel?.type ?? null,
      appointments: 0,
      conversations: 0,
      reminders: 0,
    };
    bucket.reminders += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((left, right) => right.appointments - left.appointments || left.channelName.localeCompare(right.channelName));
}

function resolveChannelColor(channelType, channelName) {
  if (channelType === 'whatsapp') {
    return '#25D366';
  }

  if (channelType === 'manual') {
    return '#2563eb';
  }

  const normalized = String(channelName ?? '').toLowerCase();
  if (normalized.includes('facebook')) {
    return '#1877F2';
  }

  if (normalized.includes('telegram')) {
    return '#0088cc';
  }

  return '#64748b';
}

function groupAppointmentsByDay(appointments) {
  const buckets = new Map();

  for (const appointment of appointments) {
    const date = appointment.startTime.slice(0, 10);
    const bucket = buckets.get(date) ?? {
      date,
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      rescheduled: 0,
      noShow: 0,
    };

    bucket.total += 1;
    const statusKey = mapAppointmentStatusKey(appointment.status);
    if (statusKey) {
      bucket[statusKey] += 1;
    }
    buckets.set(date, bucket);
  }

  return Array.from(buckets.values()).sort((left, right) => left.date.localeCompare(right.date));
}

function countWhere(items, predicate) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function mapAppointmentStatusKey(status) {
  switch (status) {
    case 'pending':
    case 'confirmed':
    case 'cancelled':
    case 'completed':
    case 'rescheduled':
      return status;
    case 'no_show':
      return 'noShow';
    default:
      return null;
  }
}

function clampScheduledFor(candidate, now) {
  return candidate >= now ? candidate : now;
}

function requireScopedAppointment(appointment, scope, label) {
  if (!appointment) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (appointment.organizationId !== scope.organizationId || appointment.locationId !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return appointment;
}

function requireScopedReminder(reminder, scope, label) {
  if (!reminder) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (reminder.organization_id !== scope.organizationId || reminder.location_id !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return reminder;
}

function page(items) {
  return { items, nextCursor: null };
}

function makeHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
