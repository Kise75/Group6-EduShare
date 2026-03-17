const express = require('express');
const {
  getUserProfile,
  updateProfile,
  changePassword,
  getUserListings,
  getUserReviews,
  getUserTrust,
  searchUsers,
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', authMiddleware, searchUsers);
router.get('/:id', getUserProfile);
router.get('/:id/listings', getUserListings);
router.get('/:id/reviews', getUserReviews);
router.get('/:id/trust', getUserTrust);

// Protected routes
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
