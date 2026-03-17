const express = require('express');
const {
  getNotificationSummary,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/summary', getNotificationSummary);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:notificationId/read', markNotificationAsRead);

module.exports = router;
