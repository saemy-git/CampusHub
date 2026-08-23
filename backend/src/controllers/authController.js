/**
 * CAMPUSHUB AUTHENTICATION CONTROLLER
 * Real Email OTP generation, verification, JWT session tokens, and profile management.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../../../database/db');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');

/**
 * POST /api/auth/send-otp
 * Generates and emails a cryptographically secure 6-digit OTP
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !otpService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid college email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check resend cooldown
    const existingOtp = db.getActiveOtp(normalizedEmail);
    if (existingOtp && Date.now() - existingOtp.last_sent_at < config.OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((config.OTP_COOLDOWN_MS - (Date.now() - existingOtp.last_sent_at)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before requesting another code.`,
        retryAfter: waitSeconds
      });
    }

    // Generate secure 6-digit OTP & HMAC Hash
    const otp = otpService.generateSecureOtp();
    const otpHash = otpService.hashOtp(otp, normalizedEmail);
    const expiresAt = Date.now() + config.OTP_EXPIRY_MS;

    // Persist hashed OTP to SQLite database
    db.saveEmailOtp(normalizedEmail, otpHash, expiresAt, Date.now());

    // Dispatch transactional email (or log in local dev mode)
    await emailService.sendOtpEmail(normalizedEmail, otp);

    return res.json({
      success: true,
      message: 'Verification code sent to your email.',
      expiresInMinutes: 5
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies 6-digit OTP, creates/finds student user, and issues authenticated session
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otpService.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid college email address.'
      });
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit verification code.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    // Retrieve active OTP record
    const otpRecord = db.getActiveOtp(normalizedEmail);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found. Please request a new one.'
      });
    }

    // Check expiration
    if (Date.now() > otpRecord.expires_at) {
      db.deleteEmailOtp(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Please request a new one.'
      });
    }

    // Check maximum attempts
    if (otpRecord.attempts >= config.OTP_MAX_ATTEMPTS) {
      db.deleteEmailOtp(normalizedEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.'
      });
    }

    // Verify OTP Hash timing-safely
    const isValid = otpService.verifyOtpHash(cleanOtp, normalizedEmail, otpRecord.otp_hash);
    if (!isValid) {
      db.incrementOtpAttempts(normalizedEmail);
      const remaining = config.OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
      if (remaining <= 0) {
        db.deleteEmailOtp(normalizedEmail);
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new code.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. Please try again (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`
      });
    }

    // Invalidate OTP immediately upon successful verification
    db.deleteEmailOtp(normalizedEmail);

    // Create or retrieve user from database
    let user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      user = db.createOrUpdateUser({
        email: normalizedEmail,
        isVerified: true
      });
    } else if (!user.isVerified) {
      user = db.updateUser(user.id, { isVerified: true });
    }

    // Sign JWT Authentication Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Set secure HttpOnly session cookie
    res.cookie('campushub_token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      success: true,
      message: 'Email verified successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        department: user.department,
        year: user.year,
        isVerified: true,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        avatar: user.avatar,
        xp: user.xp
      },
      token: token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Restores and returns authenticated user session
 */
exports.getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.'
    });
  }
  return res.json({
    success: true,
    user: req.user
  });
};

/**
 * POST /api/auth/logout
 * Clears authentication session cookie
 */
exports.logout = (req, res) => {
  res.clearCookie('campushub_token', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * GET /api/auth/profile
 */
exports.getProfile = (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 'user-01';
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile or POST /api/users/profile
 * Updates authenticated student's profile information
 */
exports.updateProfile = (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 'user-01';
    const updated = db.updateUser(userId, req.body);
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
