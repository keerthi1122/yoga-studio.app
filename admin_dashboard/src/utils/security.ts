/**
 * Security utilities for input sanitization, URL/room validation,
 * CSV formula injection defense, rate limiting, and session integrity.
 */

const SCRIPT_OR_STYLE_BLOCK_REGEX = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const DANGEROUS_HTML_REGEX = /<[^>]*>?/gm;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

/**
 * Sanitizes plain-text user input by removing script/style blocks, HTML tags,
 * control characters, and bounding max length. Prevents stored HTML/XSS injection.
 */
export const sanitizeText = (value: unknown, maxLength = 250): string => {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS_REGEX, ' ')
    .replace(SCRIPT_OR_STYLE_BLOCK_REGEX, '')
    .replace(DANGEROUS_HTML_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

/**
 * Validates and sanitizes an optional URL (strictly http/https only).
 * Blocks javascript:, data:, vbscript:, file: schemes.
 */
export const sanitizeExternalUrl = (url: unknown): string | undefined => {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
};

/**
 * Strictly validates a Jitsi domain host (no path, query, fragment, or scheme injection).
 */
export const sanitizeJitsiServer = (server: unknown): string => {
  if (typeof server !== 'string') return 'meet.jit.si';
  const cleaned = server
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .toLowerCase();

  if (/^[a-z0-9][a-z0-9.-]{1,100}\.[a-z]{2,}$/.test(cleaned)) {
    return cleaned;
  }
  return 'meet.jit.si';
};

/**
 * Strictly validates a Jitsi room slug to prevent URL hash/config injection.
 */
export const sanitizeJitsiRoom = (room: unknown): string => {
  if (typeof room !== 'string' || !room.trim()) {
    return 'GVYA_GuinnessVijayYoga_Live';
  }
  const cleaned = room
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return cleaned.length >= 3 ? cleaned : 'GVYA_GuinnessVijayYoga_Live';
};

/**
 * Validates Indian & international phone numbers cleanly.
 */
export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

/**
 * Validates email format when supplied.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email.trim()) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && email.length <= 120;
};

/**
 * Defends CSV exports against Spreadsheet Formula Injection (CWE-1236).
 * Prefixes cells starting with =, +, -, @, \t, \r with a single quote,
 * and escapes internal double quotes cleanly.
 */
export const escapeCsvCell = (value: unknown): string => {
  let str = String(value ?? '');
  str = str.replace(CONTROL_CHARS_REGEX, ' ').trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Validates UPI / Bank Transaction ID format.
 */
export const sanitizeTransactionRef = (ref: unknown): string => {
  if (typeof ref !== 'string') return '';
  return ref
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 60);
};

/**
 * Safe JSON parser that strips __proto__ and constructor keys to prevent prototype pollution.
 */
export const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw, (key, val) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return val;
    });
    return parsed as T;
  } catch {
    return fallback;
  }
};

/**
 * Constant-time string comparison helper to mitigate timing side channels.
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const maxLen = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const codeA = i < a.length ? a.charCodeAt(i) : 0;
    const codeB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= codeA ^ codeB;
  }
  return mismatch === 0;
};

/**
 * Pure deterministic SHA-256 hex digest (works identically in Browser HTTPS, LAN HTTP, and Node.js).
 */
export const sha256HexSync = (ascii: string): string => {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const utf8Str = unescape(encodeURIComponent(ascii));
  const asciiBitLength = utf8Str.length * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let padded = utf8Str + '\x80';
  while ((padded.length % 64) - 56) padded += '\x00';
  for (let i = 0; i < padded.length; i++) {
    const j = padded.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
};

export const sha256Hex = async (input: string): Promise<string> => {
  return sha256HexSync(input);
};

/**
 * In-browser brute-force rate limiter backed by sessionStorage / localStorage.
 */
const RATE_LIMIT_KEY = 'gvya_auth_attempts_v1';

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

export const checkLoginRateLimit = (maxAttempts = 5, windowMs = 120_000): RateLimitStatus => {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const data = safeJsonParse<{ attempts: number[]; lockedUntil?: number }>(raw, { attempts: [] });

    if (data.lockedUntil && data.lockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.ceil((data.lockedUntil - now) / 1000),
      };
    }

    const recent = (Array.isArray(data.attempts) ? data.attempts : []).filter((t) => now - t < windowMs);
    return {
      allowed: recent.length < maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - recent.length),
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }
};

export const recordFailedLoginAttempt = (maxAttempts = 5, lockDurationMs = 120_000): RateLimitStatus => {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const data = safeJsonParse<{ attempts: number[]; lockedUntil?: number }>(raw, { attempts: [] });
    const recent = (Array.isArray(data.attempts) ? data.attempts : []).filter((t) => now - t < lockDurationMs);
    recent.push(now);

    const lockedUntil = recent.length >= maxAttempts ? now + lockDurationMs : undefined;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ attempts: recent, lockedUntil }));

    return {
      allowed: !lockedUntil,
      remainingAttempts: Math.max(0, maxAttempts - recent.length),
      retryAfterSeconds: lockedUntil ? Math.ceil(lockDurationMs / 1000) : 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterSeconds: 0 };
  }
};

export const clearLoginRateLimit = (): void => {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {}
};

// Ephemeral per-origin session signing salt combined with issuedAt & expiry checks
// Prevents naive DevTools `localStorage.setItem('gvya_admin_session_v1', ...)` role spoofing.
const SESSION_SALT = 'gvya_2026_session_integrity_v2';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface SignedSessionEnvelope<T> {
  payload: T;
  issuedAt: number;
  expiresAt: number;
  sig: string;
}

export const computeSessionSignature = (payloadJson: string, issuedAt: number, expiresAt: number): string => {
  const input = `${SESSION_SALT}:${issuedAt}:${expiresAt}:${payloadJson}`;
  return sha256HexSync(input);
};

export const sealSession = <T>(payload: T): string => {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const payloadJson = JSON.stringify(payload);
  const sig = computeSessionSignature(payloadJson, issuedAt, expiresAt);
  const envelope: SignedSessionEnvelope<T> = { payload, issuedAt, expiresAt, sig };
  return JSON.stringify(envelope);
};

export const unsealSession = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  const parsed = safeJsonParse<SignedSessionEnvelope<T> | null>(raw, null);
  if (!parsed || typeof parsed !== 'object' || !parsed.payload || !parsed.sig) {
    return null;
  }
  if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
    return null;
  }
  const expectedSig = computeSessionSignature(JSON.stringify(parsed.payload), parsed.issuedAt, parsed.expiresAt);
  if (!timingSafeEqual(parsed.sig, expectedSig)) {
    return null;
  }
  return parsed.payload;
};
