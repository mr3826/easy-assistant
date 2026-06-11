import { config } from './config.mjs';
import {
  createSessionToken,
  generateId,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  verifyPassword,
} from './crypto.mjs';
import { withTransaction } from './db.mjs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createAuthService(repository, db = repository.db) {
  return {
    signup(input) {
      const now = Date.now();
      const name = normalizeText(input.name);
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');
      const organizationName = normalizeText(
        input.organizationName ?? input.businessName ?? input.companyName ?? input.organization ?? '',
      );
      const locationName = normalizeText(input.locationName ?? input.branchName ?? 'Main location');
      const timezone = normalizeText(input.timezone ?? input.locationTimezone ?? config.defaultTimezone);
      const slugHint = normalizeText(input.organizationSlug ?? input.slug ?? '');

      validateSignupInput({ name, email, password, organizationName });

      if (repository.findUserByEmail(email)) {
        throw makeHttpError(409, 'email_already_exists', 'An account with that email already exists.');
      }

      return withTransaction(db, () => {
        const user = repository.createUser({
          id: generateId(),
          name,
          email,
          passwordHash: hashPassword(password),
          status: 'active',
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        });

        const organizationId = generateId();
        const locationId = generateId();
        const membershipId = generateId();
        const sessionId = generateId();
        const organizationSlug = repository.createOrganizationSlug(slugHint || organizationName);

        const organization = repository.createOrganization({
          id: organizationId,
          name: organizationName,
          slug: organizationSlug,
          timezone,
          ownerUserId: user.id,
          createdAt: now,
          updatedAt: now,
        });

        const location = repository.createLocation({
          id: locationId,
          organizationId,
          name: locationName,
          timezone,
          createdAt: now,
          updatedAt: now,
        });

        repository.ensureDefaultChannel(
          { organizationId, locationId },
          { createdAt: now, updatedAt: now },
          {
            name: 'Default inbox',
            metadata: { seeded: true, source: 'signup' },
          },
        );

        const membership = repository.createMembership({
          id: membershipId,
          organizationId,
          userId: user.id,
          role: 'owner',
          active: true,
          createdAt: now,
          updatedAt: now,
        });

        const sessionToken = createSessionToken();
        const session = repository.createSession({
          id: sessionId,
          userId: user.id,
          organizationId,
          locationId,
          tokenHash: hashSessionToken(sessionToken),
          expiresAt: now + config.sessionTtlMs,
          createdAt: now,
        });

        return {
          sessionToken,
          user: repository.updateUserLastLoginAt(user.id, now, now) ?? user,
          organization,
          location,
          membership,
          memberships: [membership],
          session,
        };
      });
    },

    login(input) {
      const now = Date.now();
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');

      validateLoginInput({ email, password });

      const user = repository.findUserByEmail(email);
      if (!user || user.status === 'disabled' || !verifyPassword(password, user.password_hash)) {
        throw makeHttpError(401, 'invalid_credentials', 'Invalid email or password.');
      }

      const { membership, organization, location } = repository.findCurrentTenantForUser(user.id);
      if (!membership || !organization || !location) {
        throw makeHttpError(409, 'tenant_not_ready', 'This account does not have an active tenant context.');
      }

      const sessionToken = createSessionToken();
      const session = repository.createSession({
        id: generateId(),
        userId: user.id,
        organizationId: organization.id,
        locationId: location.id,
        tokenHash: hashSessionToken(sessionToken),
        expiresAt: now + config.sessionTtlMs,
        createdAt: now,
      });

      const updatedUser = repository.updateUserLastLoginAt(user.id, now, now) ?? user;
      const memberships = repository.listUserMemberships(user.id);

      return {
        sessionToken,
        user: updatedUser,
        organization,
        location,
        membership,
        memberships,
        session,
      };
    },

    resolveSession(sessionToken) {
      if (!sessionToken) {
        return null;
      }

      const now = Date.now();
      const session = repository.findSessionByTokenHash(hashSessionToken(sessionToken));
      if (!session || session.revoked_at || session.expires_at <= now) {
        if (session && !session.revoked_at && session.expires_at <= now) {
          repository.revokeSessionById(session.id, now);
        }
        return null;
      }

      const user = repository.findUserById(session.user_id);
      if (!user || user.status === 'disabled') {
        return null;
      }

      const memberships = repository.listUserMemberships(user.id);
      const organization = repository.findOrganizationById(session.organization_id);
      const location = repository.findLocationById(session.location_id);
      const membership = organization ? repository.findMembershipByOrganizationAndUser(organization.id, user.id) : null;
      if (!organization || !location || !membership || !location.active) {
        return null;
      }

      return {
        session,
        user,
        memberships,
        membership,
        organization,
        location,
      };
    },

    logout(sessionToken) {
      if (!sessionToken) {
        return { revoked: false };
      }

      const session = repository.findSessionByTokenHash(hashSessionToken(sessionToken));
      if (!session) {
        return { revoked: false };
      }

      repository.revokeSessionById(session.id, Date.now());
      return { revoked: true };
    },
  };
}

function validateSignupInput({ name, email, password, organizationName }) {
  if (!name) {
    throw makeHttpError(400, 'invalid_name', 'Name is required.');
  }
  if (!organizationName) {
    throw makeHttpError(400, 'invalid_organization_name', 'Organization name is required.');
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw makeHttpError(400, 'invalid_email', 'A valid email address is required.');
  }
  if (password.length < 8) {
    throw makeHttpError(400, 'weak_password', 'Password must be at least 8 characters long.');
  }
}

function validateLoginInput({ email, password }) {
  if (!EMAIL_PATTERN.test(email)) {
    throw makeHttpError(400, 'invalid_email', 'A valid email address is required.');
  }
  if (!password) {
    throw makeHttpError(400, 'invalid_password', 'Password is required.');
  }
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function makeHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
