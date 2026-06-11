export function toIso(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? new Date(numeric).toISOString() : null;
}

export function toBoolean(value) {
  return Boolean(value);
}

export function parseJsonValue(value, fallback = {}) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function serializeService(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        name: row.name,
        category: row.category,
        description: row.description,
        durationMinutes: row.duration_minutes,
        bufferMinutes: row.buffer_minutes,
        price: row.price,
        currency: row.currency,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeStaff(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        name: row.name,
        roleTitle: row.role_title,
        email: row.email,
        phone: row.phone,
        avatarUrl: row.avatar_url,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeStaffService(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        staffId: row.staff_id,
        serviceId: row.service_id,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeBusinessHour(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        weekday: row.weekday,
        openTime: row.open_time,
        closeTime: row.close_time,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeStaffHour(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        staffId: row.staff_id,
        weekday: row.weekday,
        startTime: row.start_time,
        endTime: row.end_time,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeCustomer(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        sourceChannel: row.source_channel,
        consentStatus: row.consent_status,
        lastSeenAt: toIso(row.last_seen_at),
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeChannel(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        type: row.type,
        name: row.name,
        externalAccountId: row.external_account_id,
        externalPhoneNumberId: row.external_phone_number_id,
        displayPhoneNumber: row.display_phone_number,
        encryptedAccessToken: row.encrypted_access_token,
        verifyTokenHash: row.verify_token_hash,
        active: toBoolean(row.active),
        metadata: parseJsonValue(row.metadata, {}),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeAiSettings(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        assistantName: row.assistant_name,
        tone: row.tone,
        defaultLanguage: row.default_language,
        greetingMessage: row.greeting_message,
        humanHandoffMessage: row.human_handoff_message,
        autoConfirmBookings: toBoolean(row.auto_confirm_bookings),
        reminderEnabled: toBoolean(row.reminder_enabled),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeConversation(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        channelId: row.channel_id,
        customerId: row.customer_id,
        externalConversationId: row.external_conversation_id,
        state: row.state,
        lastMessageAt: toIso(row.last_message_at),
        assignedUserId: row.assigned_user_id,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeMessage(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        conversationId: row.conversation_id,
        sender: row.sender,
        direction: row.direction,
        body: row.body,
        externalMessageId: row.external_message_id,
        sentAt: toIso(row.sent_at),
        metadata: parseJsonValue(row.metadata, {}),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeAuditLog(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        actorUserId: row.actor_user_id,
        actorType: row.actor_type,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: parseJsonValue(row.metadata, {}),
        createdAt: toIso(row.created_at),
      }
    : null;
}

export function serializeAppointment(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        customerId: row.customer_id,
        serviceId: row.service_id,
        staffId: row.staff_id,
        channelId: row.channel_id,
        conversationId: row.conversation_id,
        startTime: toIso(row.start_time),
        endTime: toIso(row.end_time),
        status: row.status,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeOrganization(row) {
  return row
    ? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        timezone: row.timezone,
        ownerUserId: row.owner_user_id,
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeLocation(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        timezone: row.timezone,
        addressLine1: row.address_line1,
        addressLine2: row.address_line2,
        city: row.city,
        region: row.region,
        country: row.country,
        phone: row.phone,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeMembership(row) {
  return row
    ? {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        role: row.role,
        active: toBoolean(row.active),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }
    : null;
}

export function serializeSession(row) {
  return row
    ? {
        id: row.id,
        userId: row.user_id,
        organizationId: row.organization_id,
        locationId: row.location_id,
        expiresAt: toIso(row.expires_at),
        revokedAt: toIso(row.revoked_at),
        createdAt: toIso(row.created_at),
      }
    : null;
}
