import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

export function generateId() {
  return cryptoRandomUUID();
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(String(password), salt, 64, SCRYPT_PARAMS);
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  const parts = String(storedHash ?? '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, nRaw, rRaw, pRaw, salt, digestHex] = parts;
  const n = Number.parseInt(nRaw, 10);
  const r = Number.parseInt(rRaw, 10);
  const p = Number.parseInt(pRaw, 10);
  if (![n, r, p].every(Number.isFinite)) {
    return false;
  }

  const derivedKey = scryptSync(String(password), salt, digestHex.length / 2, {
    N: n,
    r,
    p,
    maxmem: 32 * 1024 * 1024,
  });

  const expected = Buffer.from(digestHex, 'hex');
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function cryptoRandomUUID() {
  return globalThis.crypto?.randomUUID?.() ?? randomBytes(16).toString('hex');
}
