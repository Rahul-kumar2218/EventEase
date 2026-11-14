import crypto from 'crypto';

/**
 * Escapes characters with special meaning in regular expressions
 * to protect against ReDoS (Regular Expression Denial of Service).
 */
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes a CSV cell to prevent CSV Formula Injection / DDE attacks.
 * If the value starts with '=', '+', '-', '@', '\t', or '\r', prefix with a single quote.
 */
export const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Validates standard email address format.
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates international or domestic phone numbers (digits, optional +, space, parens, hyphens).
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^(\+)?[0-9]{7,15}$/.test(cleaned);
};

/**
 * Cryptographic HMAC signature for QR tokens to ensure tamper resistance.
 */
export const generateSignedQrToken = (rawToken, secret = process.env.JWT_SECRET || 'eventease_super_secret_jwt_key_2026_secure') => {
  const hmac = crypto.createHmac('sha256', secret).update(rawToken).digest('hex').substring(0, 16);
  return `${rawToken}.${hmac}`;
};

/**
 * Verifies if a signed QR token has a valid HMAC signature.
 */
export const verifySignedQrToken = (signedToken, secret = process.env.JWT_SECRET || 'eventease_super_secret_jwt_key_2026_secure') => {
  if (!signedToken || typeof signedToken !== 'string') return false;
  const parts = signedToken.split('.');
  if (parts.length !== 2) return false;
  const [rawToken, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(rawToken).digest('hex').substring(0, 16);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

