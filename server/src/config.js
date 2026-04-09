'use strict';

// ===========================================================================
// Centralized configuration constants
// ===========================================================================

const BCRYPT_SALT_ROUNDS = 12;

// JWT settings — shared across all auth modules
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Validate critical configuration on startup
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  console.error('Generate one with: openssl rand -hex 64');
  process.exit(1);
}

module.exports = {
  BCRYPT_SALT_ROUNDS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  COOKIE_MAX_AGE_MS,
  IS_PRODUCTION,
};
