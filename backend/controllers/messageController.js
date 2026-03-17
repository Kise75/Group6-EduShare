const Message = require('../models/Message');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { createNotification, createNotificationPayload } = require('../services/notificationService');

const participantFields = 'name profileImage role';
const listingFields = 'title images seller status';

// Get all conversations for a user
const getConversations = async (req, res) => {
  try {
    const conversations = await Message.find({
      $or: [{ participant1: req.userId }, { participant2: req.userId }],
    })
      .populate('participant1', participantFields)
      .populate('participant2', participantFields)
      .populate('listing', listingFields)
      .sort({ lastMessage: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages from a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Message.findById(conversationId)
      .populate('participant1', participantFields)
      .populate('participant2', participantFields)
      .populate('listing', listingFields);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is part of conversation
    if (
      conversation.participant1._id.toString() !== req.userId &&
      conversation.participant2._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Mark messages as read
    conversation.messages.forEach((msg) => {
      if (msg.senderId.toString() !== req.userId) {
        msg.isRead = true;
      }
    });
    await conversation.save();
    await Notification.updateMany(
      {
        user: req.userId,
        type: 'message',
        'metadata.conversationId': conversationId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    let conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is part of conversation
    if (
      conversation.participant1.toString() !== req.userId &&
      conversation.participant2.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not authorized to message in this conversation' });
    }

    // Add message
    conversation.messages.push({
      senderId: req.userId,
      text,
      timestamp: new Date(),
      isRead: false,
    });

    conversation.lastMessage = new Date();
    await conversation.save();
    const recipientId =
      conversation.participant1.toString() === req.userId
        ? conversation.participant2.toString()
        : conversation.participant1.toString();

    // Populate for response
    await conversation.populate('participant1', participantFields);
    await conversation.populate('participant2', participantFields);
    await conversation.populate('listing', listingFields);
    await createNotification(
      recipientId,
      createNotificationPayload({
        type: 'message',
        title: 'New message received',
        message: text.trim(),
        link: `/messages?conversation=${conversation._id}`,
        metadata: {
          conversationId: conversation._id.toString(),
          listingId: conversation.listing?._id?.toString() || conversation.listing?.toString() || '',
          senderId: req.userId,
        },
      })
    );

    res.status(201).json({ message: 'Message sent', conversation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start or get conversation with a seller
const startConversation = async (req, res) => {
  try {
    const { listingId, sellerId, recipientId } = req.body;
    let conversation;

    if (listingId) {
      const listing = await Listing.findById(listingId);

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const resolvedSellerId = sellerId || String(listing.seller);

      if (String(listing.seller) !== String(resolvedSellerId)) {
        return res.status(400).json({ message: 'Seller does not match this listing' });
      }

      if (String(req.userId) === String(resolvedSellerId)) {
        return res.status(400).json({ message: 'You cannot start a conversation with yourself' });
      }

      conversation = await Message.findOne({
        listing: listingId,
        $or: [
          { participant1: req.userId, participant2: resolvedSellerId },
          { participant1: resolvedSellerId, participant2: req.userId },
        ],
      });

      if (!conversation) {
        conversation = new Message({
          listing: listingId,
          participant1: req.userId,
          participant2: resolvedSellerId,
        });

        await conversation.save();
      }
    } else {
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient is required' });
      }

      if (String(req.userId) === String(recipientId)) {
        return res.status(400).json({ message: 'You cannot start a conversation with yourself' });
      }

      conversation = await Message.findOne({
        listing: null,
        $or: [
          { participant1: req.userId, participant2: recipientId },
          { participant1: recipientId, participant2: req.userId },
        ],
      });

      if (!conversation) {
        conversation = new Message({
          participant1: req.userId,
          participant2: recipientId,
        });

        await conversation.save();
      }
    }

    await conversation.populate('participant1', participantFields);
    await conversation.populate('participant2', participantFields);
    await conversation.populate('listing', listingFields);

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const unreadCount = conversation.messages.filter(
      (msg) => !msg.isRead && msg.senderId.toString() !== req.userId
    ).length;

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getUnreadCount,
};
