/**
 * CAMPUSHUB BACKEND CONFIGURATION
 */

const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '*',
  DB_PATH: path.join(__dirname, '..', '..', '..', 'database', 'campus_hub.db')
};
