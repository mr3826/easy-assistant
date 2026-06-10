import { randomUUID } from 'node:crypto';
import { config } from './config.mjs';

export function createRepository(db) {
  return {
    db,

    findUserByEmail(email) {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
    },

    findUserById(userId) {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) ?? null;
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
      return db.prepare('SELECT * FROM organizations WHERE id = ?').get(organizationId) ?? null;
    },

    findLocationById(locationId) {
      return db.prepare('SELECT * FROM locations WHERE id = ?').get(locationId) ?? null;
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
      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, status, last_login_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
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
      return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) ?? null;
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
      return db
        .prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC')
        .all(userId);
    },
  };
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
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48) || `tenant-${randomUUID().slice(0, 8)}`;
}
