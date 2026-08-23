const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, optionalAuth } = require('../middlewares/auth');

// Real OTP Authentication Endpoints
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', authController.logout);

// Profile Management
router.get('/profile', optionalAuth, authController.getProfile);
router.put('/profile', optionalAuth, authController.updateProfile);
router.post('/profile', optionalAuth, authController.updateProfile);

module.exports = router;
