import { generateId } from './crypto.mjs';
import {
  serializeChannel,
  serializeConversation,
  serializeMessage,
  serializeService,
  serializeStaff,
} from './serializers.mjs';

const MESSAGE_SENDERS = new Set(['customer', 'ai', 'human', 'system']);
const MESSAGE_DIRECTIONS = new Set(['inbound', 'outbound', 'internal']);
const CONVERSATION_STATES = new Set(['ai_handled', 'human_handled', 'closed']);

export function createPhase4Service(repository) {
  return {
    listChannels(scope) {
      this.ensureChannelSeed(scope);
      return page(repository.listChannels(scope).map(serializeChannel));
    },

    listConversations(scope) {
      this.ensureChannelSeed(scope);
      return page(repository.listConversations(scope).map(serializeConversation));
    },

    getConversation(scope, conversationId) {
      return {
        conversation: requireScopedConversation(repository.findConversationById(conversationId), scope, 'conversation'),
      };
    },

    listMessages(scope, conversationId) {
      requireScopedConversation(repository.findConversationById(conversationId), scope, 'conversation');
      return page(repository.listMessages(scope, conversationId).map(serializeMessage));
    },

    sendMessage(scope, actorUserId, conversationId, input) {
      const now = Date.now();
      const current = requireScopedConversation(repository.findConversationById(conversationId), scope, 'conversation');
      if (current.state === 'closed') {
        throw makeHttpError(409, 'conversation_closed', 'This conversation is closed.');
      }

      const sender = normalizeSender(input.sender);
      const direction = normalizeDirection(input.direction, sender);
      const body = requireText(input.body ?? input.text, 'Message body is required.');
      const sentAt = parseOptionalIsoDateTime(input.sentAt, now);
      const channel = repository.findChannelById(current.channel_id);
      const customer = current.customer_id ? repository.findCustomerById(current.customer_id) : null;
      if (channel?.type === 'whatsapp' && direction === 'outbound' && customer?.consent_status === 'opted_out' && sender !== 'system') {
        throw makeHttpError(409, 'customer_opted_out', 'This customer has opted out of WhatsApp messaging.');
      }

      const metadata = normalizeObjectMetadata(input.metadata, {});
      if (channel?.type === 'whatsapp' && direction === 'outbound') {
        metadata.transport = 'whatsapp';
        metadata.deliveryStatus = 'queued';
        metadata.channelId = channel.id;
        metadata.channelType = channel.type;
      }

      const message = repository.createMessage({
        id: generateId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        conversationId,
        sender,
        direction,
        body,
        externalMessageId: normalizeNullableText(input.externalMessageId),
        sentAt,
        metadata,
        createdAt: now,
        updatedAt: now,
      });

      const conversation =
        sender === 'human'
          ? repository.updateConversation(conversationId, {
              state: 'human_handled',
              assignedUserId: actorUserId ?? current.assigned_user_id,
              lastMessageAt: sentAt,
              updatedAt: now,
            })
          : sender === 'system'
            ? repository.updateConversation(conversationId, {
                lastMessageAt: sentAt,
                updatedAt: now,
              })
            : repository.findConversationById(conversationId);

      return {
        message: serializeMessage(message),
        conversation: serializeConversation(conversation),
      };
    },

    takeoverConversation(scope, actorUserId, conversationId) {
      const now = Date.now();
      const current = requireScopedConversation(repository.findConversationById(conversationId), scope, 'conversation');
      if (current.state === 'closed') {
        throw makeHttpError(409, 'conversation_closed', 'This conversation is closed.');
      }

      const conversation = repository.updateConversation(conversationId, {
        state: 'human_handled',
        assignedUserId: actorUserId ?? current.assigned_user_id,
        updatedAt: now,
      });

      return { conversation: serializeConversation(conversation) };
    },

    closeConversation(scope, conversationId) {
      const now = Date.now();
      const current = requireScopedConversation(repository.findConversationById(conversationId), scope, 'conversation');
      const conversation =
        current.state === 'closed'
          ? current
          : repository.updateConversation(conversationId, {
              state: 'closed',
              updatedAt: now,
            });

      return { conversation: serializeConversation(conversation) };
    },

    ensureChannelSeed(scope) {
      const now = Date.now();
      return repository.ensureDefaultChannel(
        scope,
        { createdAt: now, updatedAt: now },
        {
          name: 'Default inbox',
          metadata: { seeded: true, source: 'conversation' },
        },
      );
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

function requireScopedConversation(conversation, scope, label) {
  if (!conversation) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (conversation.organization_id !== scope.organizationId || conversation.location_id !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return conversation;
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

function normalizeSender(value) {
  const sender = normalizeText(value || 'human');
  if (!MESSAGE_SENDERS.has(sender)) {
    throw makeHttpError(400, 'invalid_input', 'sender must be one of customer, ai, human, or system.');
  }
  return sender;
}

function normalizeDirection(value, sender) {
  const fallback = sender === 'customer' ? 'inbound' : sender === 'system' ? 'internal' : 'outbound';
  const direction = normalizeText(value || fallback);
  if (!MESSAGE_DIRECTIONS.has(direction)) {
    throw makeHttpError(400, 'invalid_input', 'direction must be one of inbound, outbound, or internal.');
  }
  return direction;
}

function normalizeJsonValue(value, fallback = {}) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) {
      return fallback;
    }

    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizeObjectMetadata(value, fallback = {}) {
  const metadata = normalizeJsonValue(value, fallback);
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return fallback;
  }

  return metadata;
}

function parseOptionalIsoDateTime(value, fallbackEpoch) {
  if (value === null || value === undefined || value === '') {
    return fallbackEpoch;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw makeHttpError(400, 'invalid_input', 'sentAt must be a valid timestamp.');
    }
    return value;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw makeHttpError(400, 'invalid_input', 'sentAt must be a valid ISO date-time.');
  }

  return parsed;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
