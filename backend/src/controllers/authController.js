const db = require('../../../database/db');

exports.getProfile = (req, res, next) => {
  try {
    const user = db.getUser('user-01');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = (req, res, next) => {
  try {
    const updated = db.updateUser('user-01', req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.login = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = db.getUser('user-01');
    res.json({
      success: true,
      message: 'Authentication successful',
      token: 'jwt-campushub-builder-token-demo',
      user: user
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = (req, res, next) => {
  try {
    const { email } = req.body;
    res.json({
      success: true,
      message: `Verification OTP sent to ${email || 'your email'}`,
      otpExpiresIn: 60
    });
  } catch (error) {
    next(error);
  }
};
