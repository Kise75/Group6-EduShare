const express = require('express');
const { createReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createReport);

module.exports = router;
