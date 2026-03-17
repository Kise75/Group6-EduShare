const express = require('express');
const { createReview, getUserReviews, canReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/user/:userId', getUserReviews);

// Protected routes
router.post('/', authMiddleware, createReview);
router.get('/can-review/:meetupId', authMiddleware, canReview);

module.exports = router;
