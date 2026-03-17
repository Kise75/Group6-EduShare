const Message = require('../models/Message');
const Meetup = require('../models/Meetup');
const Review = require('../models/Review');
const User = require('../models/User');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const average = (values) => {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const calculateAverageResponseMinutes = (conversations, userId) => {
  const samples = [];

  conversations.forEach((conversation) => {
    const messages = [...(conversation.messages || [])].sort(
      (left, right) => new Date(left.timestamp) - new Date(right.timestamp)
    );

    for (let index = 0; index < messages.length - 1; index += 1) {
      const current = messages[index];
      if (String(current.senderId) === String(userId)) {
        continue;
      }

      const response = messages.slice(index + 1).find((message) => String(message.senderId) === String(userId));
      if (!response) {
        continue;
      }

      const minutes =
        (new Date(response.timestamp).getTime() - new Date(current.timestamp).getTime()) / (1000 * 60);
      if (minutes >= 0) {
        samples.push(minutes);
      }
    }
  });

  return average(samples);
};

const buildBadgeSet = ({ trustScore, user, completedTransactions, averageResponseMinutes }) => {
  const badges = [];

  if (user?.emailVerified) {
    badges.push({ label: 'Verified Student', tone: 'verified' });
  }

  if (trustScore >= 75 && completedTransactions >= 2) {
    badges.push({ label: 'Trusted Seller', tone: 'trusted' });
  }

  if (averageResponseMinutes > 0 && averageResponseMinutes <= 60) {
    badges.push({ label: 'Fast Responder', tone: 'fast' });
  }

  if (completedTransactions >= 5) {
    badges.push({ label: 'Campus Regular', tone: 'campus' });
  }

  return badges;
};

const calculateTrustProfile = ({ user, reviews = [], meetups = [], conversations = [] }) => {
  const completedTransactions = meetups.filter((meetup) => meetup.status === 'Completed').length;
  const cancelledTransactions = meetups.filter((meetup) => meetup.status === 'Cancelled').length;
  const averageRating = reviews.length ? average(reviews.map((review) => review.rating)) : Number(user?.rating || 0);
  const averageResponseMinutes = calculateAverageResponseMinutes(conversations, user?._id || user?.id);
  const cancellationRate =
    completedTransactions + cancelledTransactions > 0
      ? cancelledTransactions / (completedTransactions + cancelledTransactions)
      : 0;
  const responseScore =
    averageResponseMinutes <= 0
      ? 0.45
      : averageResponseMinutes <= 30
        ? 1
        : averageResponseMinutes <= 120
          ? 0.82
          : averageResponseMinutes <= 360
            ? 0.62
            : 0.35;

  const trustScore = clamp(
    Math.round(
      (averageRating / 5) * 45 +
        Math.min(25, completedTransactions * 4.5) +
        responseScore * 15 +
        (user?.emailVerified ? 10 : 0) -
        cancellationRate * 15
    ),
    0,
    100
  );

  return {
    trustScore,
    averageRating: Number(averageRating.toFixed(2)),
    completedTransactions,
    cancelledTransactions,
    cancellationRate: Number((cancellationRate * 100).toFixed(1)),
    averageResponseMinutes: Number(averageResponseMinutes.toFixed(1)),
    badges: buildBadgeSet({
      trustScore,
      user,
      completedTransactions,
      averageResponseMinutes,
    }),
  };
};

const buildTrustMap = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];

  if (!uniqueIds.length) {
    return {};
  }

  const [users, reviews, meetups, conversations] = await Promise.all([
    User.find({ _id: { $in: uniqueIds } }),
    Review.find({ reviewee: { $in: uniqueIds } }),
    Meetup.find({
      $or: [{ seller: { $in: uniqueIds } }, { buyer: { $in: uniqueIds } }],
    }),
    Message.find({
      $or: [{ participant1: { $in: uniqueIds } }, { participant2: { $in: uniqueIds } }],
    }),
  ]);

  const trustMap = {};

  uniqueIds.forEach((userId) => {
    const user = users.find((item) => String(item._id) === userId);
    const userReviews = reviews.filter((review) => String(review.reviewee) === userId);
    const userMeetups = meetups.filter(
      (meetup) => String(meetup.seller) === userId || String(meetup.buyer) === userId
    );
    const userConversations = conversations.filter(
      (conversation) =>
        String(conversation.participant1) === userId || String(conversation.participant2) === userId
    );

    trustMap[userId] = calculateTrustProfile({
      user,
      reviews: userReviews,
      meetups: userMeetups,
      conversations: userConversations,
    });
  });

  return trustMap;
};

const getTrustProfileForUser = async (userId) => {
  const trustMap = await buildTrustMap([userId]);
  return trustMap[String(userId)] || null;
};

module.exports = {
  buildTrustMap,
  calculateAverageResponseMinutes,
  calculateTrustProfile,
  getTrustProfileForUser,
};
