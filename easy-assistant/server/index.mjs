import http from 'node:http';
import { config } from './config.mjs';
import { openDatabase } from './db.mjs';
import { createRepository } from './repository.mjs';
import { createAuthService } from './auth-service.mjs';
import { createPhase2Service } from './phase2.mjs';
import { createPhase4Service } from './phase4.mjs';
import { createPhase5Service } from './phase5.mjs';
import { createPhase6Service } from './phase6.mjs';
import {
  buildSessionCookie,
  clearSessionCookie,
  emptyResponse,
  jsonResponse,
  parseCookies,
  readJsonBody,
  textResponse,
} from './http-utils.mjs';

const db = openDatabase();
const repository = createRepository(db);
const auth = createAuthService(repository, db);
const phase2 = createPhase2Service(repository);
const phase4 = createPhase4Service(repository);
const phase5 = createPhase5Service(repository, { credentialSecret: config.whatsappCredentialSecret });
const phase6 = createPhase6Service(repository, { phase2, phase4 });

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

    if (pathname === '/api/webhooks/whatsapp' && method === 'GET') {
      const verifyToken = url.searchParams.get('hub.verify_token') ?? url.searchParams.get('verify_token');
      const challenge = url.searchParams.get('hub.challenge') ?? url.searchParams.get('challenge');
      const response = phase5.verifyWebhook({ verifyToken, challenge });
      textResponse(res, 200, response.challenge, requestOrigin);
      return;
    }

    if (pathname === '/api/webhooks/whatsapp' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 200, phase5.ingestWebhook(body), requestOrigin);
      return;
    }

    const session = requireSession(req);
    const scope = toTenantScope(session);

    if (pathname === '/api/organizations' && method === 'GET') {
      jsonResponse(res, 200, page([toOrganizationPayload(session.organization)]), requestOrigin);
      return;
    }

    if (pathname === '/api/locations' && method === 'GET') {
      jsonResponse(res, 200, page([toLocationPayload(session.location)]), requestOrigin);
      return;
    }

    if (pathname === '/api/channels' && method === 'GET') {
      jsonResponse(res, 200, phase4.listChannels(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/ai-settings' && method === 'GET') {
      jsonResponse(res, 200, phase6.getAiSettings(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/ai-settings' && method === 'PATCH') {
      const body = await readJsonBody(req);
      jsonResponse(res, 200, phase6.updateAiSettings(scope, body), requestOrigin);
      return;
    }

    const channelMatch = pathname.match(/^\/api\/channels\/([^/]+)$/);
    if (channelMatch) {
      const channelId = decodeURIComponent(channelMatch[1]);
      if (method === 'GET') {
        jsonResponse(res, 200, phase5.getChannel(scope, channelId), requestOrigin);
        return;
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        jsonResponse(res, 200, phase5.updateChannel(scope, channelId, body), requestOrigin);
        return;
      }
    }

    if (pathname === '/api/ai/receptionist/run' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 200, phase6.runReceptionist(scope, body, { actorUserId: session.user.id }), requestOrigin);
      return;
    }

    if (pathname === '/api/conversations' && method === 'GET') {
      jsonResponse(res, 200, phase4.listConversations(scope), requestOrigin);
      return;
    }

    const conversationMessagesMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if (conversationMessagesMatch && method === 'GET') {
      jsonResponse(res, 200, phase4.listMessages(scope, decodeURIComponent(conversationMessagesMatch[1])), requestOrigin);
      return;
    }

    if (conversationMessagesMatch && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(
        res,
        201,
        phase4.sendMessage(
          scope,
          session.user.id,
          decodeURIComponent(conversationMessagesMatch[1]),
          unwrapPayload(body, 'message'),
        ),
        requestOrigin,
      );
      return;
    }

    const conversationTakeoverMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/takeover$/);
    if (conversationTakeoverMatch && method === 'POST') {
      await readJsonBody(req);
      jsonResponse(
        res,
        200,
        phase4.takeoverConversation(scope, session.user.id, decodeURIComponent(conversationTakeoverMatch[1])),
        requestOrigin,
      );
      return;
    }

    const conversationHumanTakeoverMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/human-takeover$/);
    if (conversationHumanTakeoverMatch && method === 'POST') {
      await readJsonBody(req);
      jsonResponse(
        res,
        200,
        phase4.takeoverConversation(scope, session.user.id, decodeURIComponent(conversationHumanTakeoverMatch[1])),
        requestOrigin,
      );
      return;
    }

    const conversationCloseMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/close$/);
    if (conversationCloseMatch && method === 'POST') {
      await readJsonBody(req);
      jsonResponse(
        res,
        200,
        phase4.closeConversation(scope, decodeURIComponent(conversationCloseMatch[1])),
        requestOrigin,
      );
      return;
    }

    const conversationMatch = pathname.match(/^\/api\/conversations\/([^/]+)$/);
    if (conversationMatch && method === 'GET') {
      jsonResponse(
        res,
        200,
        phase4.getConversation(scope, decodeURIComponent(conversationMatch[1])),
        requestOrigin,
      );
      return;
    }

    if (pathname === '/api/services' && method === 'GET') {
      jsonResponse(res, 200, phase2.listServices(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/services' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 201, phase2.createService(scope, unwrapPayload(body, 'service')), requestOrigin);
      return;
    }

    const serviceMatch = pathname.match(/^\/api\/services\/([^/]+)$/);
    if (serviceMatch) {
      const serviceId = decodeURIComponent(serviceMatch[1]);
      if (method === 'GET') {
        jsonResponse(res, 200, phase2.getService(scope, serviceId), requestOrigin);
        return;
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        jsonResponse(res, 200, phase2.updateService(scope, serviceId, unwrapPayload(body, 'service')), requestOrigin);
        return;
      }
      if (method === 'DELETE') {
        jsonResponse(res, 200, phase2.deleteService(scope, serviceId), requestOrigin);
        return;
      }
    }

    if (pathname === '/api/staff' && method === 'GET') {
      jsonResponse(res, 200, phase2.listStaff(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/staff' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 201, phase2.createStaff(scope, unwrapPayload(body, 'staff')), requestOrigin);
      return;
    }

    const staffMatch = pathname.match(/^\/api\/staff\/([^/]+)$/);
    if (staffMatch) {
      const staffId = decodeURIComponent(staffMatch[1]);
      if (method === 'GET') {
        jsonResponse(res, 200, phase2.getStaff(scope, staffId), requestOrigin);
        return;
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        jsonResponse(res, 200, phase2.updateStaff(scope, staffId, unwrapPayload(body, 'staff')), requestOrigin);
        return;
      }
      if (method === 'DELETE') {
        jsonResponse(res, 200, phase2.deleteStaff(scope, staffId), requestOrigin);
        return;
      }
    }

    const staffServicesMatch = pathname.match(/^\/api\/staff\/([^/]+)\/services$/);
    if (staffServicesMatch && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 201, phase2.assignStaffService(scope, decodeURIComponent(staffServicesMatch[1]), unwrapPayload(body, 'assignment')), requestOrigin);
      return;
    }

    if (pathname === '/api/availability/business-hours' && method === 'GET') {
      jsonResponse(res, 200, phase2.listAvailabilityBusinessHours(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/availability/business-hours' && method === 'PUT') {
      const body = await readJsonBody(req);
      jsonResponse(
        res,
        200,
        phase2.replaceAvailabilityBusinessHours(scope, { hours: unwrapHours(body, 'hours') }),
        requestOrigin,
      );
      return;
    }

    const staffHoursMatch = pathname.match(/^\/api\/availability\/staff-hours\/([^/]+)$/);
    if (staffHoursMatch && method === 'GET') {
      jsonResponse(res, 200, phase2.listStaffHours(scope, decodeURIComponent(staffHoursMatch[1])), requestOrigin);
      return;
    }

    if (staffHoursMatch && method === 'PUT') {
      const body = await readJsonBody(req);
      jsonResponse(
        res,
        200,
        phase2.replaceStaffHours(scope, decodeURIComponent(staffHoursMatch[1]), { hours: unwrapHours(body, 'hours') }),
        requestOrigin,
      );
      return;
    }

    if (pathname === '/api/customers' && method === 'GET') {
      jsonResponse(res, 200, phase2.listCustomers(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/customers' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 201, phase2.createCustomer(scope, unwrapPayload(body, 'customer')), requestOrigin);
      return;
    }

    const customerMatch = pathname.match(/^\/api\/customers\/([^/]+)$/);
    if (customerMatch) {
      const customerId = decodeURIComponent(customerMatch[1]);
      if (method === 'GET') {
        jsonResponse(res, 200, phase2.getCustomer(scope, customerId), requestOrigin);
        return;
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        jsonResponse(res, 200, phase2.updateCustomer(scope, customerId, unwrapPayload(body, 'customer')), requestOrigin);
        return;
      }
      if (method === 'DELETE') {
        jsonResponse(res, 200, phase2.deleteCustomer(scope, customerId), requestOrigin);
        return;
      }
    }

    if (pathname === '/api/appointments' && method === 'GET') {
      jsonResponse(res, 200, phase2.listAppointments(scope), requestOrigin);
      return;
    }

    if (pathname === '/api/appointments' && method === 'POST') {
      const body = await readJsonBody(req);
      jsonResponse(res, 201, phase2.createAppointment(scope, unwrapPayload(body, 'appointment')), requestOrigin);
      return;
    }

    const appointmentMatch = pathname.match(/^\/api\/appointments\/([^/]+)$/);
    if (appointmentMatch) {
      const appointmentId = decodeURIComponent(appointmentMatch[1]);
      if (method === 'GET') {
        jsonResponse(res, 200, phase2.getAppointment(scope, appointmentId), requestOrigin);
        return;
      }
      if (method === 'PATCH') {
        const body = await readJsonBody(req);
        jsonResponse(res, 200, phase2.updateAppointment(scope, appointmentId, unwrapPayload(body, 'appointment')), requestOrigin);
        return;
      }
      if (method === 'DELETE') {
        jsonResponse(res, 200, phase2.deleteAppointment(scope, appointmentId), requestOrigin);
        return;
      }
    }

    const appointmentStatusMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
    if (appointmentStatusMatch && method === 'PATCH') {
      const body = await readJsonBody(req);
      const appointmentId = decodeURIComponent(appointmentStatusMatch[1]);
      jsonResponse(res, 200, phase2.updateAppointmentStatus(scope, appointmentId, body?.status ?? body), requestOrigin);
      return;
    }

    const appointmentRescheduleMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/reschedule$/);
    if (appointmentRescheduleMatch && (method === 'PATCH' || method === 'POST')) {
      const body = await readJsonBody(req);
      const appointmentId = decodeURIComponent(appointmentRescheduleMatch[1]);
      jsonResponse(res, 200, phase2.rescheduleAppointment(scope, appointmentId, unwrapPayload(body, 'appointment')), requestOrigin);
      return;
    }

    const appointmentCancelMatch = pathname.match(/^\/api\/appointments\/([^/]+)\/cancel$/);
    if (appointmentCancelMatch && method === 'POST') {
      const appointmentId = decodeURIComponent(appointmentCancelMatch[1]);
      jsonResponse(res, 200, phase2.deleteAppointment(scope, appointmentId), requestOrigin);
      return;
    }

    if (pathname === '/api/availability/slots' && method === 'GET') {
      const serviceId = url.searchParams.get('serviceId');
      const date = url.searchParams.get('date');
      const staffId = url.searchParams.get('staffId') || undefined;
      if (!serviceId || !date) {
        throw makeHttpError(400, 'invalid_input', 'serviceId and date are required.');
      }

      jsonResponse(
        res,
        200,
        phase2.getAvailabilitySlots(scope, {
          serviceId: decodeURIComponent(serviceId),
          date,
          staffId: staffId ? decodeURIComponent(staffId) : undefined,
        }),
        requestOrigin,
      );
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

function page(items) {
  return { items, nextCursor: null };
}

function requireSession(req) {
  const sessionToken = parseCookies(req.headers.cookie ?? '')[config.cookieName];
  const session = auth.resolveSession(sessionToken);
  if (!session) {
    throw makeHttpError(401, 'unauthorized', 'Authentication required.');
  }
  return session;
}

function toTenantScope(session) {
  return {
    organizationId: session.organization.id,
    locationId: session.location.id,
    timezone: session.location.timezone ?? session.organization.timezone ?? config.defaultTimezone,
  };
}

function unwrapPayload(body, key) {
  if (body && typeof body === 'object' && !Array.isArray(body) && key in body) {
    const value = body[key];
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

function unwrapHours(body, key) {
  const payload = unwrapPayload(body, key);
  if (Array.isArray(payload)) {
    return payload;
  }

  if ('hours' in payload && Array.isArray(payload.hours)) {
    return payload.hours;
  }

  return [];
}

function makeHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
