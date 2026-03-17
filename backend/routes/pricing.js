const express = require('express');
const { getPriceSuggestion } = require('../controllers/pricingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/suggest', authMiddleware, getPriceSuggestion);

module.exports = router;
