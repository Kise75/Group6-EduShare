const Message = require('../models/Message');
const Meetup = require('../models/Meetup');
const Notification = require('../models/Notification');

const getUnreadMessageCount = async (userId) => {
  const conversations = await Message.find({
    $or: [{ participant1: userId }, { participant2: userId }],
  }).select('messages');

  return conversations.reduce(
    (sum, conversation) =>
      sum +
      (conversation.messages || []).filter(
        (message) => !message.isRead && String(message.senderId) !== String(userId)
      ).length,
    0
  );
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
    const [unreadNotifications, unreadMessages, pendingMeetups] = await Promise.all([
      Notification.countDocuments({ user: req.userId, isRead: false }),
      getUnreadMessageCount(req.userId),
      Meetup.countDocuments({
        $or: [{ buyer: req.userId }, { seller: req.userId }],
        status: { $in: ['Pending', 'Confirmed'] },
      }),
    ]);

    res.json({
      notifications,
      summary: {
        unreadNotifications,
        unreadMessages,
        pendingMeetups,
        totalAttentionItems: unreadNotifications + pendingMeetups,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotificationSummary = async (req, res) => {
  try {
    const [unreadNotifications, unreadMessages, pendingMeetups] = await Promise.all([
      Notification.countDocuments({ user: req.userId, isRead: false }),
      getUnreadMessageCount(req.userId),
      Meetup.countDocuments({
        $or: [{ buyer: req.userId }, { seller: req.userId }],
        status: { $in: ['Pending', 'Confirmed'] },
      }),
    ]);

    res.json({
      unreadNotifications,
      unreadMessages,
      pendingMeetups,
      totalAttentionItems: unreadNotifications + pendingMeetups,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      user: req.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotificationSummary,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
};
