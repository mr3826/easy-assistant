import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = dirname(fileURLToPath(import.meta.url));

function readIntEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolEnv(name, fallback = false) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

export const config = {
  appName: process.env.APP_NAME ?? 'Easy Assistant',
  host: process.env.HOST ?? '0.0.0.0',
  port: readIntEnv('PORT', 3000),
  databasePath: process.env.EASY_ASSISTANT_DB_PATH ?? join(serverDir, 'data', 'easy-assistant.sqlite'),
  defaultTimezone: process.env.DEFAULT_TIMEZONE ?? 'Asia/Dhaka',
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'easy_assistant_session',
  cookiePath: process.env.SESSION_COOKIE_PATH ?? '/',
  cookieDomain: process.env.SESSION_COOKIE_DOMAIN ?? undefined,
  cookieSecure: readBoolEnv('SESSION_COOKIE_SECURE', false),
  cookieSameSite: process.env.SESSION_COOKIE_SAMESITE ?? 'Lax',
  sessionTtlMs: readIntEnv('SESSION_TTL_MS', 1000 * 60 * 60 * 24 * 30),
  maxBodyBytes: readIntEnv('MAX_BODY_BYTES', 1024 * 1024),
  corsOrigin: process.env.CORS_ORIGIN ?? undefined,
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

export const serverDirPath = serverDir;
