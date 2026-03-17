const express = require('express');
const {
  getCampusLocations,
  getMyHistory,
  getMeetup,
  createMeetup,
  confirmMeetup,
  completeMeetup,
  cancelMeetup,
  getMeetupSuggestions,
} = require('../controllers/meetupController');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/campus-locations', getCampusLocations);
router.get('/suggestions/:listingId', optionalAuth, getMeetupSuggestions);

// Protected routes
router.get('/history/me', authMiddleware, getMyHistory);
router.post('/', authMiddleware, createMeetup);
router.put('/:meetupId/confirm', authMiddleware, confirmMeetup);
router.put('/:meetupId/complete', authMiddleware, completeMeetup);
router.put('/:meetupId/cancel', authMiddleware, cancelMeetup);
router.get('/:listingId', getMeetup);

module.exports = router;
