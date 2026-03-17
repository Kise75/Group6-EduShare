const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', authMiddleware, verifyEmail);
router.post('/resend-verification', authMiddleware, resendVerification);

module.exports = router;
