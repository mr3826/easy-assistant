import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

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

export function hashText(value) {
  return createHash('sha256').update(String(value ?? '')).digest('hex');
}

export function encryptSecret(value, secret) {
  const plaintext = String(value ?? '');
  if (!plaintext) {
    return null;
  }

  const key = deriveSecretKey(secret);
  const iv = randomBytes(12);
  const salt = randomBytes(16);
  const derivedKey = scryptSync(key, salt, 32, SCRYPT_PARAMS);
  const cipher = createCipheriv('aes-256-gcm', derivedKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    'v1',
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export function decryptSecret(value, secret) {
  const encoded = String(value ?? '');
  if (!encoded) {
    return null;
  }

  const [version, saltRaw, ivRaw, tagRaw, ciphertextRaw] = encoded.split('.');
  if (version !== 'v1' || !saltRaw || !ivRaw || !tagRaw || !ciphertextRaw) {
    return null;
  }

  try {
    const key = deriveSecretKey(secret);
    const salt = Buffer.from(saltRaw, 'base64');
    const iv = Buffer.from(ivRaw, 'base64');
    const tag = Buffer.from(tagRaw, 'base64');
    const ciphertext = Buffer.from(ciphertextRaw, 'base64');
    const derivedKey = scryptSync(key, salt, 32, SCRYPT_PARAMS);
    const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function cryptoRandomUUID() {
  return globalThis.crypto?.randomUUID?.() ?? randomBytes(16).toString('hex');
}

function deriveSecretKey(secret) {
  return String(secret ?? '').trim() || 'easy-assistant-dev-whatsapp-secret';
}
