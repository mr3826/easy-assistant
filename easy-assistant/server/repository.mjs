import { randomUUID } from 'node:crypto';
import { config } from './config.mjs';

export function createRepository(db) {
  return {
    db,

    findUserByEmail(email) {
      return one(db, 'users', 'email', email);
    },

    findUserById(userId) {
      return one(db, 'users', 'id', userId);
    },

    listUserMemberships(userId) {
      return db
        .prepare(
          `
            SELECT m.*, o.name AS organization_name, o.slug AS organization_slug, o.timezone AS organization_timezone
            FROM memberships m
            INNER JOIN organizations o ON o.id = m.organization_id
            WHERE m.user_id = ? AND m.active = 1
            ORDER BY m.created_at ASC
          `,
        )
        .all(userId);
    },

    findOrganizationById(organizationId) {
      return one(db, 'organizations', 'id', organizationId);
    },

    findLocationById(locationId) {
      return one(db, 'locations', 'id', locationId);
    },

    findLocationsByOrganizationId(organizationId) {
      return db
        .prepare('SELECT * FROM locations WHERE organization_id = ? AND active = 1 ORDER BY created_at ASC')
        .all(organizationId);
    },

    findMembershipByOrganizationAndUser(organizationId, userId) {
      return (
        db
          .prepare('SELECT * FROM memberships WHERE organization_id = ? AND user_id = ? AND active = 1 LIMIT 1')
          .get(organizationId, userId) ?? null
      );
    },

    createUser(input) {
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, status, last_login_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.name,
        input.email,
        input.passwordHash,
        input.status ?? 'active',
        input.lastLoginAt ?? null,
        input.createdAt,
        input.updatedAt,
      );
      return this.findUserById(input.id);
    },

    updateUserLastLoginAt(userId, lastLoginAt, updatedAt = lastLoginAt) {
      db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(lastLoginAt, updatedAt, userId);
      return this.findUserById(userId);
    },

    createOrganization(input) {
      db.prepare(`
        INSERT INTO organizations (id, name, slug, timezone, owner_user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.name,
        input.slug,
        input.timezone ?? config.defaultTimezone,
        input.ownerUserId ?? null,
        input.createdAt,
        input.updatedAt,
      );
      return this.findOrganizationById(input.id);
    },

    createLocation(input) {
      db.prepare(`
        INSERT INTO locations (
          id, organization_id, name, timezone, address_line1, address_line2, city, region, country, phone,
          active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.name,
        input.timezone ?? config.defaultTimezone,
        input.addressLine1 ?? null,
        input.addressLine2 ?? null,
        input.city ?? null,
        input.region ?? null,
        input.country ?? null,
        input.phone ?? null,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findLocationById(input.id);
    },

    createMembership(input) {
      db.prepare(`
        INSERT INTO memberships (id, organization_id, user_id, role, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.userId,
        input.role,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findMembershipByOrganizationAndUser(input.organizationId, input.userId);
    },

    createSession(input) {
      db.prepare(`
        INSERT INTO sessions (
          id, user_id, organization_id, location_id, token_hash, expires_at, revoked_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.userId,
        input.organizationId,
        input.locationId,
        input.tokenHash,
        input.expiresAt,
        input.revokedAt ?? null,
        input.createdAt,
      );
      return this.findSessionById(input.id);
    },

    findSessionById(sessionId) {
      return one(db, 'sessions', 'id', sessionId);
    },

    findSessionByTokenHash(tokenHash) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM sessions
              WHERE token_hash = ?
              ORDER BY created_at DESC
              LIMIT 1
            `,
          )
          .get(tokenHash) ?? null
      );
    },

    revokeSessionById(sessionId, revokedAt) {
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(revokedAt, sessionId);
      return this.findSessionById(sessionId);
    },

    findCurrentTenantForUser(userId) {
      const memberships = this.listUserMemberships(userId);
      if (!memberships.length) {
        return { membership: null, organization: null, location: null };
      }

      const membership = chooseCurrentMembership(memberships);
      const organization = this.findOrganizationById(membership.organization_id);
      if (!organization) {
        return { membership, organization: null, location: null };
      }

      const locations = this.findLocationsByOrganizationId(organization.id);
      const location = locations[0] ?? null;
      return { membership, organization, location };
    },

    createOrganizationSlug(baseName) {
      const baseSlug = slugify(baseName);
      let candidate = baseSlug;
      let suffix = 2;

      while (true) {
        const existing = db.prepare('SELECT 1 FROM organizations WHERE slug = ? LIMIT 1').get(candidate);
        if (!existing) {
          return candidate;
        }
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
    },

    listSessionsForUser(userId) {
      return db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    listChannels(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM channels
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY CASE WHEN type = 'manual' THEN 0 ELSE 1 END, created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    findChannelById(channelId) {
      return one(db, 'channels', 'id', channelId);
    },

    findChannelByExternalPhoneNumberId(externalPhoneNumberId) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM channels
              WHERE external_phone_number_id = ? AND active = 1
              ORDER BY created_at ASC
              LIMIT 1
            `,
          )
          .get(externalPhoneNumberId) ?? null
      );
    },

    findChannelByVerifyTokenHash(verifyTokenHash) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM channels
              WHERE verify_token_hash = ? AND active = 1
              ORDER BY created_at ASC
              LIMIT 1
            `,
          )
          .get(verifyTokenHash) ?? null
      );
    },

    createChannel(input) {
      db.prepare(`
        INSERT INTO channels (
          id, organization_id, location_id, type, name, external_account_id, external_phone_number_id,
          display_phone_number, encrypted_access_token, verify_token_hash, active, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.type,
        input.name,
        input.externalAccountId ?? null,
        input.externalPhoneNumberId ?? null,
        input.displayPhoneNumber ?? null,
        input.encryptedAccessToken ?? null,
        input.verifyTokenHash ?? null,
        input.active === false ? 0 : 1,
        stringifyJsonValue(input.metadata, {}),
        input.createdAt,
        input.updatedAt,
      );
      return this.findChannelById(input.id);
    },

    updateChannel(channelId, updates) {
      updateRow(db, 'channels', 'id', channelId, {
        type: updates.type,
        name: updates.name,
        external_account_id: updates.externalAccountId,
        external_phone_number_id: updates.externalPhoneNumberId,
        display_phone_number: updates.displayPhoneNumber,
        encrypted_access_token: updates.encryptedAccessToken,
        verify_token_hash: updates.verifyTokenHash,
        metadata: updates.metadata === undefined ? undefined : stringifyJsonValue(updates.metadata, {}),
        active: updates.active === undefined ? undefined : booleanToInt(updates.active),
        updated_at: updates.updatedAt,
      });
      return this.findChannelById(channelId);
    },

    deactivateChannel(channelId, updatedAt) {
      updateRow(db, 'channels', 'id', channelId, { active: 0, updated_at: updatedAt });
      return this.findChannelById(channelId);
    },

    ensureDefaultChannel(scope, timestamps, defaults = {}) {
      const existing = db
        .prepare(
          `
            SELECT *
            FROM channels
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY CASE WHEN type = 'manual' THEN 0 ELSE 1 END, created_at ASC
            LIMIT 1
          `,
        )
        .get(scope.organizationId, scope.locationId);

      if (existing) {
        return existing;
      }

      return this.createChannel({
        id: generateRowId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        type: defaults.type ?? 'manual',
        name: defaults.name ?? 'Default inbox',
        externalAccountId: defaults.externalAccountId ?? null,
        externalPhoneNumberId: defaults.externalPhoneNumberId ?? null,
        displayPhoneNumber: defaults.displayPhoneNumber ?? null,
        encryptedAccessToken: defaults.encryptedAccessToken ?? null,
        verifyTokenHash: defaults.verifyTokenHash ?? null,
        metadata: defaults.metadata ?? { seeded: true, source: 'signup' },
        active: defaults.active ?? true,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      });
    },

    findAiSettingsByScope(scope) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM ai_settings
              WHERE organization_id = ? AND location_id = ?
              LIMIT 1
            `,
          )
          .get(scope.organizationId, scope.locationId) ?? null
      );
    },

    ensureAiSettings(scope, timestamps, defaults = {}) {
      const existing = this.findAiSettingsByScope(scope);
      if (existing) {
        return existing;
      }

      return this.createAiSettings({
        id: generateRowId(),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        assistantName: defaults.assistantName ?? 'Easy Assistant',
        tone: defaults.tone ?? 'friendly',
        defaultLanguage: defaults.defaultLanguage ?? 'en',
        greetingMessage:
          defaults.greetingMessage ?? "Hi! I'm your booking assistant. How can I help you today?",
        humanHandoffMessage:
          defaults.humanHandoffMessage ?? 'Thanks. A human team member will take it from here.',
        autoConfirmBookings: defaults.autoConfirmBookings ?? true,
        reminderEnabled: defaults.reminderEnabled ?? false,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      });
    },

    createAiSettings(input) {
      db.prepare(`
        INSERT INTO ai_settings (
          id, organization_id, location_id, assistant_name, tone, default_language, greeting_message,
          human_handoff_message, auto_confirm_bookings, reminder_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.assistantName,
        input.tone,
        input.defaultLanguage,
        input.greetingMessage,
        input.humanHandoffMessage,
        input.autoConfirmBookings === false ? 0 : 1,
        input.reminderEnabled === true ? 1 : 0,
        input.createdAt,
        input.updatedAt,
      );
      return this.findAiSettingsByScope({
        organizationId: input.organizationId,
        locationId: input.locationId,
      });
    },

    updateAiSettings(aiSettingsId, updates) {
      updateRow(db, 'ai_settings', 'id', aiSettingsId, {
        assistant_name: updates.assistantName,
        tone: updates.tone,
        default_language: updates.defaultLanguage,
        greeting_message: updates.greetingMessage,
        human_handoff_message: updates.humanHandoffMessage,
        auto_confirm_bookings: updates.autoConfirmBookings === undefined ? undefined : booleanToInt(updates.autoConfirmBookings),
        reminder_enabled: updates.reminderEnabled === undefined ? undefined : booleanToInt(updates.reminderEnabled),
        updated_at: updates.updatedAt,
      });
      return one(db, 'ai_settings', 'id', aiSettingsId);
    },

    createAuditLog(input) {
      db.prepare(`
        INSERT INTO audit_logs (
          id, organization_id, location_id, actor_user_id, actor_type, action, entity_type, entity_id, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId ?? null,
        input.actorUserId ?? null,
        input.actorType,
        input.action,
        input.entityType,
        input.entityId ?? null,
        stringifyJsonValue(input.metadata, {}),
        input.createdAt,
      );
      return one(db, 'audit_logs', 'id', input.id);
    },

    listAuditLogs(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM audit_logs
            WHERE organization_id = ? AND (location_id = ? OR location_id IS NULL)
            ORDER BY created_at DESC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    listServices(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM services
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    findServiceById(serviceId) {
      return one(db, 'services', 'id', serviceId);
    },

    createService(input) {
      db.prepare(`
        INSERT INTO services (
          id, organization_id, location_id, name, category, description, duration_minutes, buffer_minutes,
          price, currency, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.name,
        input.category ?? null,
        input.description ?? null,
        input.durationMinutes,
        input.bufferMinutes ?? 0,
        input.price ?? 0,
        input.currency ?? 'BDT',
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findServiceById(input.id);
    },

    updateService(serviceId, updates) {
      updateRow(db, 'services', 'id', serviceId, {
        name: updates.name,
        category: updates.category,
        description: updates.description,
        duration_minutes: updates.durationMinutes,
        buffer_minutes: updates.bufferMinutes,
        price: updates.price,
        currency: updates.currency,
        active: updates.active === undefined ? undefined : booleanToInt(updates.active),
        updated_at: updates.updatedAt,
      });
      return this.findServiceById(serviceId);
    },

    deactivateService(serviceId, updatedAt) {
      updateRow(db, 'services', 'id', serviceId, { active: 0, updated_at: updatedAt });
      return this.findServiceById(serviceId);
    },

    listStaff(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM staff
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    findStaffById(staffId) {
      return one(db, 'staff', 'id', staffId);
    },

    createStaff(input) {
      db.prepare(`
        INSERT INTO staff (
          id, organization_id, location_id, name, role_title, email, phone, avatar_url, active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.name,
        input.roleTitle ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.avatarUrl ?? null,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findStaffById(input.id);
    },

    updateStaff(staffId, updates) {
      updateRow(db, 'staff', 'id', staffId, {
        name: updates.name,
        role_title: updates.roleTitle,
        email: updates.email,
        phone: updates.phone,
        avatar_url: updates.avatarUrl,
        active: updates.active === undefined ? undefined : booleanToInt(updates.active),
        updated_at: updates.updatedAt,
      });
      return this.findStaffById(staffId);
    },

    deactivateStaff(staffId, updatedAt) {
      updateRow(db, 'staff', 'id', staffId, { active: 0, updated_at: updatedAt });
      return this.findStaffById(staffId);
    },

    listStaffServices(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM staff_services
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    listStaffServicesForStaff(scope, staffId) {
      return db
        .prepare(
          `
            SELECT *
            FROM staff_services
            WHERE organization_id = ? AND location_id = ? AND staff_id = ? AND active = 1
            ORDER BY created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId, staffId);
    },

    upsertStaffService(input) {
      const existing = db
        .prepare(
          `
            SELECT *
            FROM staff_services
            WHERE organization_id = ? AND location_id = ? AND staff_id = ? AND service_id = ?
            LIMIT 1
          `,
        )
        .get(input.organizationId, input.locationId, input.staffId, input.serviceId);

      if (existing) {
        updateRow(db, 'staff_services', 'id', existing.id, {
          active: input.active === undefined ? 1 : booleanToInt(input.active),
          updated_at: input.updatedAt,
        });
        return this.findStaffServiceById(existing.id);
      }

      db.prepare(`
        INSERT INTO staff_services (
          id, organization_id, location_id, staff_id, service_id, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.staffId,
        input.serviceId,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findStaffServiceById(input.id);
    },

    findStaffServiceById(staffServiceId) {
      return one(db, 'staff_services', 'id', staffServiceId);
    },

    deactivateStaffService(staffServiceId, updatedAt) {
      updateRow(db, 'staff_services', 'id', staffServiceId, { active: 0, updated_at: updatedAt });
      return this.findStaffServiceById(staffServiceId);
    },

    replaceStaffServices(scope, staffId, serviceIds, timestamps) {
      const existing = this.listStaffServicesForStaff(scope, staffId);
      const keep = new Set(serviceIds);

      for (const assignment of existing) {
        if (!keep.has(assignment.service_id)) {
          this.deactivateStaffService(assignment.id, timestamps.updatedAt);
        }
      }

      for (const serviceId of serviceIds) {
        this.upsertStaffService({
          id: generateRowId(),
          organizationId: scope.organizationId,
          locationId: scope.locationId,
          staffId,
          serviceId,
          active: true,
          createdAt: timestamps.createdAt,
          updatedAt: timestamps.updatedAt,
        });
      }

      return this.listStaffServicesForStaff(scope, staffId);
    },

    listBusinessHours(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM business_hours
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY weekday ASC, open_time ASC, created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    replaceBusinessHours(scope, hours, timestamps) {
      db.prepare(
        `
          UPDATE business_hours
          SET active = 0, updated_at = ?
          WHERE organization_id = ? AND location_id = ? AND active = 1
        `,
      ).run(timestamps.updatedAt, scope.organizationId, scope.locationId);

      const inserted = [];
      for (const hour of hours) {
        const row = this.createBusinessHour({
          id: generateRowId(),
          organizationId: scope.organizationId,
          locationId: scope.locationId,
          weekday: hour.weekday,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          active: hour.active ?? true,
          createdAt: timestamps.createdAt,
          updatedAt: timestamps.updatedAt,
        });
        inserted.push(row);
      }

      return inserted;
    },

    findBusinessHourById(businessHourId) {
      return one(db, 'business_hours', 'id', businessHourId);
    },

    createBusinessHour(input) {
      db.prepare(`
        INSERT INTO business_hours (
          id, organization_id, location_id, weekday, open_time, close_time, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.weekday,
        input.openTime,
        input.closeTime,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findBusinessHourById(input.id);
    },

    listStaffHours(scope, staffId) {
      return db
        .prepare(
          `
            SELECT *
            FROM staff_hours
            WHERE organization_id = ? AND location_id = ? AND staff_id = ? AND active = 1
            ORDER BY weekday ASC, start_time ASC, created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId, staffId);
    },

    replaceStaffHours(scope, staffId, hours, timestamps) {
      db.prepare(
        `
          UPDATE staff_hours
          SET active = 0, updated_at = ?
          WHERE organization_id = ? AND location_id = ? AND staff_id = ? AND active = 1
        `,
      ).run(timestamps.updatedAt, scope.organizationId, scope.locationId, staffId);

      const inserted = [];
      for (const hour of hours) {
        const row = this.createStaffHour({
          id: generateRowId(),
          organizationId: scope.organizationId,
          locationId: scope.locationId,
          staffId,
          weekday: hour.weekday,
          startTime: hour.startTime,
          endTime: hour.endTime,
          active: hour.active ?? true,
          createdAt: timestamps.createdAt,
          updatedAt: timestamps.updatedAt,
        });
        inserted.push(row);
      }

      return inserted;
    },

    findStaffHourById(staffHourId) {
      return one(db, 'staff_hours', 'id', staffHourId);
    },

    createStaffHour(input) {
      db.prepare(`
        INSERT INTO staff_hours (
          id, organization_id, location_id, staff_id, weekday, start_time, end_time, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.staffId,
        input.weekday,
        input.startTime,
        input.endTime,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findStaffHourById(input.id);
    },

    listCustomers(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM customers
            WHERE organization_id = ? AND location_id = ? AND active = 1
            ORDER BY created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    findCustomerByPhone(scope, phone) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM customers
              WHERE organization_id = ? AND location_id = ? AND phone = ? AND active = 1
              ORDER BY created_at ASC
              LIMIT 1
            `,
          )
          .get(scope.organizationId, scope.locationId, phone) ?? null
      );
    },

    listConversations(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM conversations
            WHERE organization_id = ? AND location_id = ?
            ORDER BY COALESCE(last_message_at, created_at) DESC, created_at DESC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    findConversationById(conversationId) {
      return one(db, 'conversations', 'id', conversationId);
    },

    findConversationByChannelAndCustomer(channelId, customerId) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM conversations
              WHERE channel_id = ? AND customer_id = ?
              ORDER BY COALESCE(last_message_at, created_at) DESC, created_at DESC
              LIMIT 1
            `,
          )
          .get(channelId, customerId) ?? null
      );
    },

    findConversationByChannelAndExternalConversationId(channelId, externalConversationId) {
      return (
        db
          .prepare(
            `
              SELECT *
              FROM conversations
              WHERE channel_id = ? AND external_conversation_id = ?
              ORDER BY COALESCE(last_message_at, created_at) DESC, created_at DESC
              LIMIT 1
            `,
          )
          .get(channelId, externalConversationId) ?? null
      );
    },

    createConversation(input) {
      db.prepare(`
        INSERT INTO conversations (
          id, organization_id, location_id, channel_id, customer_id, external_conversation_id, state,
          last_message_at, assigned_user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.channelId,
        input.customerId ?? null,
        input.externalConversationId ?? null,
        input.state ?? 'ai_handled',
        input.lastMessageAt ?? null,
        input.assignedUserId ?? null,
        input.createdAt,
        input.updatedAt,
      );
      return this.findConversationById(input.id);
    },

    updateConversation(conversationId, updates) {
      updateRow(db, 'conversations', 'id', conversationId, {
        channel_id: updates.channelId,
        customer_id: updates.customerId,
        external_conversation_id: updates.externalConversationId,
        state: updates.state,
        last_message_at: updates.lastMessageAt,
        assigned_user_id: updates.assignedUserId,
        updated_at: updates.updatedAt,
      });
      return this.findConversationById(conversationId);
    },

    listMessages(scope, conversationId) {
      return db
        .prepare(
          `
            SELECT *
            FROM messages
            WHERE organization_id = ? AND location_id = ? AND conversation_id = ?
            ORDER BY sent_at ASC, created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId, conversationId);
    },

    findMessageById(messageId) {
      return one(db, 'messages', 'id', messageId);
    },

    createMessage(input) {
      db.prepare(`
        INSERT INTO messages (
          id, organization_id, location_id, conversation_id, sender, direction, body, external_message_id,
          sent_at, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.conversationId,
        input.sender,
        input.direction,
        input.body,
        input.externalMessageId ?? null,
        input.sentAt,
        stringifyJsonValue(input.metadata, {}),
        input.createdAt,
        input.updatedAt,
      );

      updateRow(db, 'conversations', 'id', input.conversationId, {
        last_message_at: input.sentAt,
        updated_at: input.updatedAt,
      });

      return this.findMessageById(input.id);
    },

    updateMessage(messageId, updates) {
      updateRow(db, 'messages', 'id', messageId, {
        sender: updates.sender,
        direction: updates.direction,
        body: updates.body,
        external_message_id: updates.externalMessageId,
        sent_at: updates.sentAt,
        metadata: updates.metadata === undefined ? undefined : stringifyJsonValue(updates.metadata, {}),
        updated_at: updates.updatedAt,
      });
      return this.findMessageById(messageId);
    },

    findCustomerById(customerId) {
      return one(db, 'customers', 'id', customerId);
    },

    createCustomer(input) {
      db.prepare(`
        INSERT INTO customers (
          id, organization_id, location_id, name, phone, email, source_channel, consent_status,
          last_seen_at, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.name ?? null,
        input.phone,
        input.email ?? null,
        input.sourceChannel ?? 'manual',
        input.consentStatus ?? 'unknown',
        input.lastSeenAt ?? null,
        input.active === false ? 0 : 1,
        input.createdAt,
        input.updatedAt,
      );
      return this.findCustomerById(input.id);
    },

    updateCustomer(customerId, updates) {
      updateRow(db, 'customers', 'id', customerId, {
        name: updates.name,
        phone: updates.phone,
        email: updates.email,
        source_channel: updates.sourceChannel,
        consent_status: updates.consentStatus,
        last_seen_at: updates.lastSeenAt,
        active: updates.active === undefined ? undefined : booleanToInt(updates.active),
        updated_at: updates.updatedAt,
      });
      return this.findCustomerById(customerId);
    },

    deactivateCustomer(customerId, updatedAt) {
      updateRow(db, 'customers', 'id', customerId, { active: 0, updated_at: updatedAt });
      return this.findCustomerById(customerId);
    },

    listAppointments(scope) {
      return db
        .prepare(
          `
            SELECT *
            FROM appointments
            WHERE organization_id = ? AND location_id = ?
            ORDER BY start_time DESC, created_at DESC
          `,
        )
        .all(scope.organizationId, scope.locationId);
    },

    listAppointmentsForRange(scope, startTime, endTime) {
      return db
        .prepare(
          `
            SELECT *
            FROM appointments
            WHERE organization_id = ? AND location_id = ? AND start_time < ? AND end_time > ?
            ORDER BY start_time ASC, created_at ASC
          `,
        )
        .all(scope.organizationId, scope.locationId, endTime, startTime);
    },

    findAppointmentById(appointmentId) {
      return one(db, 'appointments', 'id', appointmentId);
    },

    createAppointment(input) {
      db.prepare(`
        INSERT INTO appointments (
          id, organization_id, location_id, customer_id, service_id, staff_id, channel_id, conversation_id,
          start_time, end_time, status, notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.organizationId,
        input.locationId,
        input.customerId,
        input.serviceId,
        input.staffId,
        input.channelId ?? null,
        input.conversationId ?? null,
        input.startTime,
        input.endTime,
        input.status ?? 'pending',
        input.notes ?? null,
        input.createdBy ?? 'manual',
        input.createdAt,
        input.updatedAt,
      );
      return this.findAppointmentById(input.id);
    },

    updateAppointment(appointmentId, updates) {
      updateRow(db, 'appointments', 'id', appointmentId, {
        customer_id: updates.customerId,
        service_id: updates.serviceId,
        staff_id: updates.staffId,
        channel_id: updates.channelId,
        conversation_id: updates.conversationId,
        start_time: updates.startTime,
        end_time: updates.endTime,
        status: updates.status,
        notes: updates.notes,
        created_by: updates.createdBy,
        updated_at: updates.updatedAt,
      });
      return this.findAppointmentById(appointmentId);
    },

    updateAppointmentStatus(appointmentId, status, updatedAt) {
      updateRow(db, 'appointments', 'id', appointmentId, { status, updated_at: updatedAt });
      return this.findAppointmentById(appointmentId);
    },

    cancelAppointment(appointmentId, updatedAt, notes) {
      updateRow(db, 'appointments', 'id', appointmentId, {
        status: 'cancelled',
        notes,
        updated_at: updatedAt,
      });
      return this.findAppointmentById(appointmentId);
    },

    rescheduleAppointment(appointmentId, startTime, endTime, updatedAt, status = 'rescheduled') {
      updateRow(db, 'appointments', 'id', appointmentId, {
        start_time: startTime,
        end_time: endTime,
        status,
        updated_at: updatedAt,
      });
      return this.findAppointmentById(appointmentId);
    },
  };
}

function one(db, table, column, value) {
  return db.prepare(`SELECT * FROM ${table} WHERE ${column} = ? LIMIT 1`).get(value) ?? null;
}

function updateRow(db, table, idColumn, id, updates) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return;
  }

  const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`).run(...values, id);
}

function booleanToInt(value) {
  return value ? 1 : 0;
}

function stringifyJsonValue(value, fallback = {}) {
  if (value === undefined) {
    return JSON.stringify(fallback);
  }

  return JSON.stringify(value);
}

function chooseCurrentMembership(memberships) {
  return [...memberships].sort((a, b) => {
    const roleRank = membershipRoleRank(a.role) - membershipRoleRank(b.role);
    if (roleRank !== 0) {
      return roleRank;
    }
    return Number(a.created_at) - Number(b.created_at);
  })[0];
}

function membershipRoleRank(role) {
  switch (role) {
    case 'owner':
      return 0;
    case 'admin':
      return 1;
    case 'staff':
      return 2;
    default:
      return 3;
  }
}

function slugify(value) {
  return (
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 48) || `tenant-${randomUUID().slice(0, 8)}`
  );
}

function generateRowId() {
  return randomUUID();
}
