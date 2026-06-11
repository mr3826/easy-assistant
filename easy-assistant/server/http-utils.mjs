import { Buffer } from 'node:buffer';
import { config } from './config.mjs';

export function jsonResponse(res, statusCode, body, requestOrigin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(requestOrigin),
    ...extraHeaders,
  };

  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(body));
}

export function textResponse(res, statusCode, body, requestOrigin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(requestOrigin),
    ...extraHeaders,
  };

  res.writeHead(statusCode, headers);
  res.end(String(body ?? ''));
}

export function emptyResponse(res, statusCode, requestOrigin, extraHeaders = {}) {
  res.writeHead(statusCode, {
    ...corsHeaders(requestOrigin),
    ...extraHeaders,
  });
  res.end();
}

export function corsHeaders(requestOrigin) {
  const origin = resolveCorsOrigin(requestOrigin);
  if (!origin) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    Vary: 'Origin',
  };
}

export function resolveCorsOrigin(requestOrigin) {
  if (!requestOrigin) {
    return undefined;
  }

  if (config.corsOrigin && config.corsOrigin !== requestOrigin) {
    return undefined;
  }

  return requestOrigin;
}

export async function readJsonBody(req) {
  const raw = await readRawBody(req);
  if (!raw) {
    return {};
  }

  const contentType = String(req.headers['content-type'] ?? '').toLowerCase();
  if (contentType.includes('application/json') || contentType === '') {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      const error = new Error('Invalid JSON body');
      error.statusCode = 400;
      error.code = 'invalid_json';
      throw error;
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw.toString('utf8')));
  }

  return {};
}

async function readRawBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > config.maxBodyBytes) {
      const error = new Error('Request body too large');
      error.statusCode = 413;
      error.code = 'request_too_large';
      throw error;
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

export function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAgeMs !== undefined) {
    segments.push(`Max-Age=${Math.floor(options.maxAgeMs / 1000)}`);
  }
  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }
  segments.push(`Path=${options.path ?? '/'}`);
  if (options.expiresAtMs !== undefined) {
    segments.push(`Expires=${new Date(options.expiresAtMs).toUTCString()}`);
  }
  if (options.httpOnly !== false) {
    segments.push('HttpOnly');
  }
  if (options.secure) {
    segments.push('Secure');
  }
  segments.push(`SameSite=${options.sameSite ?? 'Lax'}`);

  return segments.join('; ');
}

export function buildSessionCookie(token, secure = false) {
  return serializeCookie(config.cookieName, token, {
    httpOnly: true,
    path: config.cookiePath,
    domain: config.cookieDomain,
    secure,
    sameSite: config.cookieSameSite,
    maxAgeMs: config.sessionTtlMs,
  });
}

export function clearSessionCookie(secure = false) {
  return serializeCookie(config.cookieName, '', {
    httpOnly: true,
    path: config.cookiePath,
    domain: config.cookieDomain,
    secure,
    sameSite: config.cookieSameSite,
    expiresAtMs: 0,
  });
}
