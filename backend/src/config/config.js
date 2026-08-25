/**
 * CAMPUSHUB BACKEND CONFIGURATION
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
} catch (e) {
  // dotenv optional in environments with pre-loaded vars
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_PATH: path.join(__dirname, '..', '..', '..', 'database', 'campus_hub.db'),

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'campushub-builder-network-jwt-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Email / SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'CampusHub <no-reply@campushub.edu>',

  // OTP Rules
  OTP_EXPIRY_MS: 5 * 60 * 1000,     // 5 minutes
  OTP_MAX_ATTEMPTS: 5,             // Max failed attempts before lock
  OTP_COOLDOWN_MS: 60 * 1000       // 60 seconds cooldown between resends
};
