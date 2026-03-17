const express = require('express');
const { getAdminOverview, updateUserRole } = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/overview', getAdminOverview);
router.put('/users/:userId/role', updateUserRole);

module.exports = router;
