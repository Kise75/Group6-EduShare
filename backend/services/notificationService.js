const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotificationPayload = ({
  type,
  title,
  message,
  link = '',
  metadata = {},
  priority = 'normal',
}) => ({
  type,
  title,
  message,
  link,
  metadata,
  priority,
});

const createNotification = async (userId, payload) => {
  if (!userId || !payload?.type || !payload?.title) {
    return null;
  }

  return Notification.create({
    user: userId,
    ...payload,
  });
};

const createNotifications = async (userIds, payloadFactory) => {
  const ids = [...new Set((userIds || []).filter(Boolean).map(String))];

  if (!ids.length) {
    return [];
  }

  const notifications = ids
    .map((userId) => {
      const payload = typeof payloadFactory === 'function' ? payloadFactory(userId) : payloadFactory;
      if (!payload?.type || !payload?.title) {
        return null;
      }

      return {
        user: userId,
        ...payload,
      };
    })
    .filter(Boolean);

  if (!notifications.length) {
    return [];
  }

  return Notification.insertMany(notifications);
};

const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: 'admin' }).select('_id');
  return createNotifications(
    admins.map((admin) => admin._id.toString()),
    payload
  );
};

module.exports = {
  createNotification,
  createNotificationPayload,
  createNotifications,
  notifyAdmins,
};
