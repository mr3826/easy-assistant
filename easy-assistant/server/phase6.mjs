import { generateId } from './crypto.mjs';
import { serializeAiSettings, serializeAuditLog, serializeConversation } from './serializers.mjs';

const AI_TONES = new Set(['friendly', 'professional', 'formal']);

export function createPhase6Service(repository, dependencies) {
  const phase2 = dependencies?.phase2;
  const phase4 = dependencies?.phase4;

  if (!phase2 || !phase4) {
    throw new Error('phase6 requires phase2 and phase4 dependencies.');
  }

  return {
    getAiSettings(scope) {
      const settings = repository.ensureAiSettings(
        scope,
        { createdAt: Date.now(), updatedAt: Date.now() },
        defaultAiSettings(),
      );
      return { settings: serializeAiSettings(settings) };
    },

    updateAiSettings(scope, input) {
      const now = Date.now();
      const current = repository.ensureAiSettings(scope, { createdAt: now, updatedAt: now }, defaultAiSettings());
      const next = normalizeAiSettingsInput(input);
      const settings = repository.updateAiSettings(current.id, {
        assistantName: next.assistantName !== undefined ? requireText(next.assistantName, 'assistantName is required.') : current.assistant_name,
        tone: next.tone !== undefined ? normalizeTone(next.tone) : current.tone,
        defaultLanguage:
          next.defaultLanguage !== undefined ? requireText(next.defaultLanguage, 'defaultLanguage is required.') : current.default_language,
        greetingMessage:
          next.greetingMessage !== undefined ? requireText(next.greetingMessage, 'greetingMessage is required.') : current.greeting_message,
        humanHandoffMessage:
          next.humanHandoffMessage !== undefined
            ? requireText(next.humanHandoffMessage, 'humanHandoffMessage is required.')
            : current.human_handoff_message,
        autoConfirmBookings:
          next.autoConfirmBookings !== undefined ? Boolean(next.autoConfirmBookings) : Boolean(current.auto_confirm_bookings),
        reminderEnabled: next.reminderEnabled !== undefined ? Boolean(next.reminderEnabled) : Boolean(current.reminder_enabled),
        updatedAt: now,
      });

      return { settings: serializeAiSettings(settings) };
    },

    runReceptionist(scope, input, context = {}) {
      const now = Date.now();
      const settings = repository.ensureAiSettings(scope, { createdAt: now, updatedAt: now }, defaultAiSettings());
      const conversationRow = requireScopedConversation(repository.findConversationById(input.conversationId), scope, 'conversation');
      const messageText = requireText(input.message ?? input.text, 'AI receptionist message is required.');
      const toolCall = normalizeToolCall(input.toolCall);
      const intent = normalizeText(input.intent ?? toolCall.intent ?? classifyIntent(messageText));

      let appointment = null;
      let assistantMessage = buildClarifyingMessage(settings, intent);
      let action = 'ai_receptionist.clarify';
      let conversation = serializeConversation(conversationRow);

      if (toolCall.type === 'createAppointment') {
        assertToolCallMatchesConversation(toolCall, conversationRow);
        assertSelectedSlotAvailable(phase2, scope, toolCall);
        const appointmentStatus = settings.auto_confirm_bookings ? 'confirmed' : 'pending';
        const created = phase2.createAppointment(scope, {
          customerId: requireText(toolCall.customerId, 'customerId is required.'),
          serviceId: requireText(toolCall.serviceId, 'serviceId is required.'),
          staffId: requireText(toolCall.staffId, 'staffId is required.'),
          channelId: toolCall.channelId ?? conversationRow.channel_id,
          conversationId: conversationRow.id,
          startTime: requireText(toolCall.startTime, 'startTime is required.'),
          endTime: requireText(toolCall.endTime, 'endTime is required.'),
          status: appointmentStatus,
          notes: normalizeNullableText(toolCall.notes ?? messageText),
          createdBy: 'ai',
        });
        appointment = created.appointment;
        assistantMessage = buildConfirmationMessage(settings, appointment);
        action = 'ai_receptionist.create_appointment';
      } else if (intent === 'handoff') {
        assistantMessage = settings.humanHandoffMessage;
        action = 'ai_receptionist.handoff';
      }

      const auditLog = repository.createAuditLog({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        actorUserId: context.actorUserId ?? null,
        actorType: 'ai',
        action,
        entityType: appointment ? 'appointment' : 'conversation',
        entityId: appointment ? appointment.id : conversationRow.id,
        metadata: {
          intent,
          messageText,
          toolCall,
          assistantName: settings.assistant_name,
          autoConfirmBookings: Boolean(settings.auto_confirm_bookings),
        },
        createdAt: now,
      });

      let aiMessage = null;
      try {
        const result = phase4.sendMessage(scope, context.actorUserId ?? null, conversationRow.id, {
          body: assistantMessage,
          sender: 'ai',
          direction: 'outbound',
          metadata: {
            source: 'ai-receptionist',
            intent,
            toolCallType: toolCall.type ?? null,
            aiSettingsId: settings.id,
            auditLogId: auditLog.id,
          },
        });
        aiMessage = result.message;
        conversation = result.conversation;
      } catch (error) {
        if (error?.code !== 'customer_opted_out') {
          throw error;
        }

        assistantMessage = settings.human_handoff_message;
      }

      return {
        settings: serializeAiSettings(settings),
        assistantMessage,
        appointment,
        conversation,
        message: aiMessage,
        auditLog: serializeAuditLog(auditLog),
      };
    },
  };
}

function defaultAiSettings() {
  return {
    assistantName: 'Easy Assistant',
    tone: 'friendly',
    defaultLanguage: 'en',
    greetingMessage: "Hi! I'm your booking assistant. How can I help you today?",
    humanHandoffMessage: 'Thanks. A human team member will take it from here.',
    autoConfirmBookings: true,
    reminderEnabled: false,
  };
}

function normalizeAiSettingsInput(input) {
  const payload = normalizeObjectValue(input?.settings, input);
  return {
    assistantName: payload.assistantName,
    tone: payload.tone,
    defaultLanguage: payload.defaultLanguage,
    greetingMessage: payload.greetingMessage,
    humanHandoffMessage: payload.humanHandoffMessage,
    autoConfirmBookings: payload.autoConfirmBookings,
    reminderEnabled: payload.reminderEnabled,
  };
}

function normalizeToolCall(toolCall) {
  const payload = normalizeObjectValue(toolCall, {});
  return {
    type: normalizeText(payload.type),
    intent: normalizeNullableText(payload.intent),
    customerId: normalizeNullableText(payload.customerId),
    serviceId: normalizeNullableText(payload.serviceId),
    staffId: normalizeNullableText(payload.staffId),
    channelId: normalizeNullableText(payload.channelId),
    conversationId: normalizeNullableText(payload.conversationId),
    startTime: normalizeNullableText(payload.startTime),
    endTime: normalizeNullableText(payload.endTime),
    notes: normalizeNullableText(payload.notes),
  };
}

function buildClarifyingMessage(settings, intent) {
  if (intent === 'book') {
    return `${settings.assistant_name}: Which service and time would you like?`;
  }

  if (intent === 'reschedule') {
    return `${settings.assistant_name}: Which booking should I move for you?`;
  }

  if (intent === 'cancel') {
    return `${settings.assistant_name}: Which booking should I cancel?`;
  }

  if (intent === 'faq') {
    return `${settings.assistant_name}: I can help with bookings. Could you share the service and preferred time?`;
  }

  return `${settings.assistant_name}: ${settings.greeting_message}`;
}

function buildConfirmationMessage(settings, appointment) {
  if (appointment.status === 'pending') {
    return `${settings.assistant_name}: I have held ${appointment.startTime}. A team member will confirm the booking shortly.`;
  }

  return `${settings.assistant_name}: You're booked for ${appointment.startTime}. I'll confirm the details shortly.`;
}

function assertToolCallMatchesConversation(toolCall, conversationRow) {
  if (toolCall.conversationId && toolCall.conversationId !== conversationRow.id) {
    throw makeHttpError(400, 'invalid_input', 'conversationId must match the active conversation.');
  }

  if (toolCall.channelId && toolCall.channelId !== conversationRow.channel_id) {
    throw makeHttpError(400, 'invalid_input', 'channelId must match the active conversation channel.');
  }
}

function assertSelectedSlotAvailable(phase2, scope, toolCall) {
  const serviceId = requireText(toolCall.serviceId, 'serviceId is required.');
  const staffId = requireText(toolCall.staffId, 'staffId is required.');
  const startTime = requireText(toolCall.startTime, 'startTime is required.');
  const endTime = requireText(toolCall.endTime, 'endTime is required.');
  const availability = phase2.getAvailabilitySlots(scope, {
    serviceId,
    date: startTime.slice(0, 10),
    staffId,
  });

  const matchedSlot = availability.slots.find(
    (slot) => slot.staffId === staffId && slot.start === startTime && slot.end === endTime,
  );

  if (!matchedSlot) {
    throw makeHttpError(409, 'slot_unavailable', 'The selected slot is not available.');
  }
}

function classifyIntent(messageText) {
  const normalized = normalizeText(messageText).toLowerCase();
  if (normalized.includes('cancel')) {
    return 'cancel';
  }
  if (normalized.includes('resched')) {
    return 'reschedule';
  }
  if (normalized.includes('book') || normalized.includes('appointment') || normalized.includes('schedule')) {
    return 'book';
  }
  if (normalized.includes('human') || normalized.includes('agent') || normalized.includes('call me')) {
    return 'handoff';
  }
  return 'faq';
}

function requireScopedConversation(conversation, scope, label) {
  if (!conversation) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (conversation.organization_id !== scope.organizationId || conversation.location_id !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return conversation;
}

function makeHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
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

function normalizeNullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeObjectValue(value, fallback = {}) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function normalizeTone(value) {
  const tone = normalizeText(value || 'friendly');
  if (!AI_TONES.has(tone)) {
    throw makeHttpError(400, 'invalid_input', 'tone must be friendly, professional, or formal.');
  }
  return tone;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
