import http from 'node:http';
import { config } from './config.mjs';
import { openDatabase } from './db.mjs';
import { createRepository } from './repository.mjs';
import { createAuthService } from './auth-service.mjs';
import {
  buildSessionCookie,
  clearSessionCookie,
  emptyResponse,
  jsonResponse,
  parseCookies,
  readJsonBody,
} from './http-utils.mjs';

const db = openDatabase();
const repository = createRepository(db);
const auth = createAuthService(repository, db);

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;
  const method = String(req.method ?? 'GET').toUpperCase();
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  if (method === 'OPTIONS') {
    emptyResponse(res, 204, requestOrigin);
    return;
  }

  try {
    if (pathname === '/api/health' && method === 'GET') {
      jsonResponse(res, 200, {
        ok: true,
        app: config.appName,
        runtime: 'node-sqlite',
        status: 'ready',
      }, requestOrigin);
      return;
    }

    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = auth.signup(body);
      jsonResponse(
        res,
        201,
        {
          user: toUserPayload(result.user),
          organization: toOrganizationPayload(result.organization),
          location: toLocationPayload(result.location),
          membership: toMembershipPayload(result.membership),
          memberships: result.memberships.map(toMembershipPayload),
          tenant: {
            organization: toOrganizationPayload(result.organization),
            location: toLocationPayload(result.location),
          },
          session: toSessionPayload(result.session),
        },
        requestOrigin,
        {
          'Set-Cookie': buildSessionCookie(result.sessionToken, isSecureCookie(req)),
        },
      );
      return;
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = auth.login(body);
      jsonResponse(
        res,
        200,
        {
          user: toUserPayload(result.user),
          organization: toOrganizationPayload(result.organization),
          location: toLocationPayload(result.location),
          membership: result.membership ? toMembershipPayload(result.membership) : null,
          memberships: result.memberships.map(toMembershipPayload),
          tenant: {
            organization: toOrganizationPayload(result.organization),
            location: toLocationPayload(result.location),
          },
          session: toSessionPayload(result.session),
        },
        requestOrigin,
        {
          'Set-Cookie': buildSessionCookie(result.sessionToken, isSecureCookie(req)),
        },
      );
      return;
    }

    if ((pathname === '/api/auth/session' || pathname === '/api/auth/me') && method === 'GET') {
      const sessionToken = parseCookies(req.headers.cookie ?? '')[config.cookieName];
      const result = auth.resolveSession(sessionToken);
      if (!result) {
        jsonResponse(res, 401, { error: { code: 'unauthorized', message: 'Authentication required.' } }, requestOrigin, {
          'Set-Cookie': clearSessionCookie(isSecureCookie(req)),
        });
        return;
      }

      jsonResponse(
        res,
        200,
        {
          user: toUserPayload(result.user),
          organization: toOrganizationPayload(result.organization),
          location: toLocationPayload(result.location),
          membership: result.membership ? toMembershipPayload(result.membership) : null,
          memberships: result.memberships.map(toMembershipPayload),
          tenant: {
            organization: toOrganizationPayload(result.organization),
            location: toLocationPayload(result.location),
          },
          session: toSessionPayload(result.session),
        },
        requestOrigin,
      );
      return;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const sessionToken = parseCookies(req.headers.cookie ?? '')[config.cookieName];
      auth.logout(sessionToken);
      emptyResponse(res, 204, requestOrigin, {
        'Set-Cookie': clearSessionCookie(isSecureCookie(req)),
      });
      return;
    }

    jsonResponse(res, 404, { error: { code: 'not_found', message: 'Route not found.' } }, requestOrigin);
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    const code = error.code ?? (statusCode >= 500 ? 'internal_error' : 'bad_request');
    const message = error.message ?? 'Unexpected error.';
    jsonResponse(
      res,
      statusCode,
      {
        error: {
          code,
          message,
        },
      },
      requestOrigin,
    );
  }
});

server.listen(config.port, config.host, () => {
  console.log(`[server] listening on http://${config.host}:${config.port}`);
  console.log(`[server] database ${config.databasePath}`);
});

function isSecureCookie(req) {
  if (config.cookieSecure) {
    return true;
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '').toLowerCase();
  return forwardedProto === 'https';
}

function toUserPayload(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    lastLoginAt: toIso(row.last_login_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toOrganizationPayload(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    ownerUserId: row.owner_user_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toLocationPayload(row) {
  if (!row) {
    return null;
  }

  return {
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
    active: Boolean(row.active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toMembershipPayload(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    active: Boolean(row.active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toSessionPayload(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    locationId: row.location_id,
    expiresAt: toIso(row.expires_at),
    revokedAt: toIso(row.revoked_at),
    createdAt: toIso(row.created_at),
  };
}

function toIso(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? new Date(numeric).toISOString() : null;
}
