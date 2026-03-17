const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getUnreadCount,
} = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getConversations);
router.get('/:conversationId', getMessages);
router.post('/:conversationId/send', sendMessage);
router.post('/start', startConversation);
router.get('/:conversationId/unread', getUnreadCount);

module.exports = router;
