const express = require('express');
const { getHomeRecommendations, getRelatedRecommendations } = require('../controllers/recommendationController');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.post('/home', optionalAuth, getHomeRecommendations);
router.post('/related/:listingId', optionalAuth, getRelatedRecommendations);

module.exports = router;
