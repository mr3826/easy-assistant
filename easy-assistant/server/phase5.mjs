import { generateId, encryptSecret, hashText } from './crypto.mjs';
import { config } from './config.mjs';
import {
  serializeChannel,
  serializeConversation,
  serializeCustomer,
  serializeMessage,
  parseJsonValue,
} from './serializers.mjs';

const OPT_OUT_PATTERNS = [/^stop(?:\s+all)?$/i, /^unsubscribe$/i, /^cancel$/i, /^end$/i, /^quit$/i];

export function createPhase5Service(repository, options = {}) {
  const credentialSecret = options.credentialSecret ?? config.whatsappCredentialSecret;

  return {
    getChannel(scope, channelId) {
      const channel = requireScopedChannel(repository.findChannelById(channelId), scope, 'channel');
      return { channel: serializeChannel(channel) };
    },

    updateChannel(scope, channelId, input) {
      const now = Date.now();
      const current = requireScopedChannel(repository.findChannelById(channelId), scope, 'channel');
      const currentMetadata = parseJsonValue(current.metadata, {});
      const channelInput = normalizeObjectValue(input.channel, input);
      const patch = normalizeChannelPatch(
        current,
        {
          ...channelInput,
          accessToken: input.accessToken ?? channelInput.accessToken,
          verifyToken: input.verifyToken ?? channelInput.verifyToken,
        },
        credentialSecret,
        currentMetadata,
      );
      const channel = repository.updateChannel(channelId, {
        type: patch.type,
        name: patch.name,
        externalAccountId: patch.externalAccountId,
        externalPhoneNumberId: patch.externalPhoneNumberId,
        displayPhoneNumber: patch.displayPhoneNumber,
        encryptedAccessToken: patch.encryptedAccessToken,
        verifyTokenHash: patch.verifyTokenHash,
        metadata: patch.metadata,
        active: patch.active,
        updatedAt: now,
      });

      return { channel: serializeChannel(channel) };
    },

    verifyWebhook(input) {
      const verifyToken = requireText(input.verifyToken, 'hub.verify_token is required.');
      const challenge = requireText(input.challenge, 'hub.challenge is required.');
      const verifyTokenHash = hashText(verifyToken);
      const channel = repository.findChannelByVerifyTokenHash(verifyTokenHash);

      if (!channel) {
        throw makeHttpError(403, 'invalid_verification_token', 'The WhatsApp verification token is invalid.');
      }

      return { challenge };
    },

    ingestWebhook(payload) {
      const events = collectInboundEvents(repository, payload);
      const processed = [];

      for (const event of events) {
        processed.push(processInboundEvent(repository, event));
      }

      return {
        ok: true,
        processed: processed.length,
        items: processed,
      };
    },
  };
}

function collectInboundEvents(repository, payload) {
  const envelope = normalizeObjectValue(payload, {});
  const entries = Array.isArray(envelope.entry) ? envelope.entry : [];
  const events = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = normalizeObjectValue(change?.value, {});
      const metadata = normalizeObjectValue(value.metadata, {});
      const phoneNumberId = normalizeNullableText(
        metadata.phone_number_id ?? metadata.phoneNumberId ?? value.phone_number_id ?? value.phoneNumberId,
      );

      if (!phoneNumberId) {
        continue;
      }

      const channel = repository.findChannelByExternalPhoneNumberId(phoneNumberId);
      if (!channel) {
        throw makeHttpError(404, 'channel_not_found', 'No WhatsApp channel is configured for the incoming phone number.');
      }

      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const message of messages) {
        events.push({
          channel,
          value,
          message,
          phoneNumberId,
        });
      }
    }
  }

  return events;
}

function processInboundEvent(repository, event) {
  const now = Date.now();
  const scope = {
    organizationId: event.channel.organization_id,
    locationId: event.channel.location_id,
  };
  const waId = resolveWhatsAppId(event.value, event.message);
  if (!waId) {
    throw makeHttpError(400, 'invalid_input', 'Inbound WhatsApp messages must include a sender phone number.');
  }

  const messageText = extractMessageText(event.message);
  if (!messageText) {
    throw makeHttpError(400, 'invalid_input', 'Inbound WhatsApp messages must include text content.');
  }

  const optOutDetected = isOptOutMessage(messageText);
  const customer = upsertCustomer(repository, scope, waId, event, optOutDetected, now);
  const externalConversationId = resolveConversationId(event.value, event.message, event.channel, waId);
  const conversation = upsertConversation(repository, scope, event.channel, customer, externalConversationId, now);
  const sentAt = resolveMessageTimestamp(event.message, now);
  const message = repository.createMessage({
    id: generateId(),
    organizationId: scope.organizationId,
    locationId: scope.locationId,
    conversationId: conversation.id,
    sender: 'customer',
    direction: 'inbound',
    body: messageText,
    externalMessageId: normalizeNullableText(event.message.id ?? event.message.message_id ?? event.message.messageId),
    sentAt,
    metadata: {
      source: 'whatsapp-webhook',
      phoneNumberId: event.phoneNumberId,
      waId,
      conversationId: externalConversationId,
      messageType: normalizeNullableText(event.message.type) ?? 'text',
      optOutDetected,
    },
    createdAt: now,
    updatedAt: now,
  });

  return {
    channel: serializeChannel(event.channel),
    customer: serializeCustomer(customer),
    conversation: serializeConversation(conversation),
    message: serializeMessage(message),
  };
}

function upsertCustomer(repository, scope, waId, event, optOutDetected, now) {
  const existing = repository.findCustomerByPhone(scope, waId);
  const inboundName = normalizeNullableText(
    event.value?.contacts?.[0]?.profile?.name ?? event.message?.profile?.name ?? event.message?.from_name,
  );
  const nextConsentStatus = optOutDetected ? 'opted_out' : 'opted_in';

  if (!existing) {
    return repository.createCustomer({
      id: generateId(),
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      name: inboundName,
      phone: waId,
      email: null,
      sourceChannel: 'whatsapp',
      consentStatus: nextConsentStatus,
      lastSeenAt: now,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return repository.updateCustomer(existing.id, {
    name: inboundName ?? existing.name,
    phone: waId,
    email: existing.email,
    sourceChannel: existing.source_channel ?? 'whatsapp',
    consentStatus: nextConsentStatus,
    lastSeenAt: now,
    active: true,
    updatedAt: now,
  });
}

function upsertConversation(repository, scope, channel, customer, externalConversationId, now) {
  const existing =
    externalConversationId !== null
      ? repository.findConversationByChannelAndExternalConversationId(channel.id, externalConversationId)
      : repository.findConversationByChannelAndCustomer(channel.id, customer.id);

  if (!existing) {
    return repository.createConversation({
      id: generateId(),
      organizationId: scope.organizationId,
      locationId: scope.locationId,
      channelId: channel.id,
      customerId: customer.id,
      externalConversationId,
      state: 'ai_handled',
      lastMessageAt: now,
      assignedUserId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  return repository.updateConversation(existing.id, {
    customerId: customer.id,
    externalConversationId,
    state: 'ai_handled',
    lastMessageAt: now,
    updatedAt: now,
  });
}

function normalizeChannelPatch(current, input, credentialSecret, currentMetadata) {
  const nextMetadata =
    input.metadata !== undefined
      ? {
          ...currentMetadata,
          ...normalizeObjectValue(input.metadata, {}),
        }
      : undefined;

  return {
    type: input.type !== undefined ? normalizeChannelType(input.type) : current.type,
    name: input.name !== undefined ? requireText(input.name, 'Channel name is required.') : current.name,
    externalAccountId:
      input.externalAccountId !== undefined ? normalizeNullableText(input.externalAccountId) : current.external_account_id,
    externalPhoneNumberId:
      input.externalPhoneNumberId !== undefined ? normalizeNullableText(input.externalPhoneNumberId) : current.external_phone_number_id,
    displayPhoneNumber:
      input.displayPhoneNumber !== undefined ? normalizeNullableText(input.displayPhoneNumber) : current.display_phone_number,
    encryptedAccessToken:
      input.accessToken !== undefined ? encryptSecret(normalizeNullableText(input.accessToken), credentialSecret) : current.encrypted_access_token,
    verifyTokenHash:
      input.verifyToken !== undefined
        ? (() => {
            const verifyToken = normalizeNullableText(input.verifyToken);
            return verifyToken ? hashText(verifyToken) : null;
          })()
        : current.verify_token_hash,
    metadata: nextMetadata,
    active: input.active !== undefined ? Boolean(input.active) : Boolean(current.active),
  };
}

function resolveWhatsAppId(value, message) {
  return normalizeNullableText(
    value?.contacts?.[0]?.wa_id ??
      value?.contacts?.[0]?.waId ??
      message?.from ??
      message?.wa_id ??
      message?.waId ??
      message?.sender?.phone,
  );
}

function resolveConversationId(value, message, channel, waId) {
  return normalizeNullableText(
    message?.conversation?.id ??
      message?.context?.conversation_id ??
      message?.context?.conversationId ??
      value?.conversation?.id ??
      value?.conversation_id ??
      value?.conversationId ??
      `${channel.id}:${waId}`,
  );
}

function extractMessageText(message) {
  return normalizeNullableText(
    message?.text?.body ??
      message?.body ??
      message?.caption ??
      message?.interactive?.button_reply?.title ??
      message?.interactive?.list_reply?.title,
  );
}

function resolveMessageTimestamp(message, fallback) {
  const raw = message?.timestamp ?? message?.sent_at ?? message?.sentAt;
  if (raw === null || raw === undefined || raw === '') {
    return fallback;
  }

  const numeric = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  if (Number.isFinite(numeric)) {
    return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  }

  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isOptOutMessage(text) {
  const normalized = normalizeText(text).replace(/\s+/g, ' ');
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function requireScopedChannel(channel, scope, label) {
  if (!channel) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  if (channel.organization_id !== scope.organizationId || channel.location_id !== scope.locationId) {
    throw makeHttpError(404, 'not_found', `${capitalize(label)} not found.`);
  }

  return channel;
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

function normalizeChannelType(value) {
  const type = normalizeText(value || 'whatsapp');
  if (type !== 'whatsapp' && type !== 'manual') {
    throw makeHttpError(400, 'invalid_input', 'channel type must be whatsapp or manual.');
  }
  return type;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
