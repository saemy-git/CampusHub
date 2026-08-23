/**
 * CAMPUSHUB SECURE OTP SERVICE
 * Cryptographic 6-digit OTP generation, hashing, and timing-safe verification.
 */

const crypto = require('crypto');
const config = require('../config/config');

/**
 * Generate a cryptographically secure 6-digit numeric OTP (e.g. "492018")
 */
function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP using HMAC-SHA256 with server secret and normalized email salt
 */
function hashOtp(otp, email) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  return crypto
    .createHmac('sha256', config.JWT_SECRET)
    .update(`${otp}:${normalizedEmail}`)
    .digest('hex');
}

/**
 * Timing-safe verification of plaintext OTP against stored hash
 */
function verifyOtpHash(otp, email, storedHash) {
  if (!otp || !storedHash) return false;
  const computedHash = hashOtp(otp, email);
  try {
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (computedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Validate and normalize college / student email address
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  // Standard RFC 5322 compliant regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(normalized)) return false;
  if (normalized.length < 5 || normalized.length > 254) return false;
  return true;
}

module.exports = {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  validateEmail
};
