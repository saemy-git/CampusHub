/**
 * CAMPUSHUB AUTHENTICATION MIDDLEWARE
 * Verifies JWT token from HttpOnly cookies or Authorization: Bearer <token> headers.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../../../database/db');

async function requireAuth(req, res, next) {
  let token = null;

  // 1. Check HttpOnly Cookie
  if (req.cookies && req.cookies.campushub_token) {
    token = req.cookies.campushub_token;
  }

  // 2. Check Authorization Header (Bearer <token>)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in or verify your college email.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Look up fresh user record from database
    let user = null;
    if (decoded.id) {
      user = await db.getUser(decoded.id);
    }
    if (!user && decoded.email) {
      user = await db.getUserByEmail(decoded.email);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated student user account not found.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please verify your email again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication session.'
    });
  }
}

async function optionalAuth(req, res, next) {
  let token = null;
  if (req.cookies && req.cookies.campushub_token) {
    token = req.cookies.campushub_token;
  } else if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = decoded.id ? await db.getUser(decoded.id) : (decoded.email ? await db.getUserByEmail(decoded.email) : null);
      if (user) req.user = user;
    } catch (e) {
      // Ignored for optional auth
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
