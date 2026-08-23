const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
