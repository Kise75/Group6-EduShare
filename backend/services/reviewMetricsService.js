const Review = require('../models/Review');
const User = require('../models/User');

const refreshUserRating = async (userId) => {
  const reviews = await Review.find({
    reviewee: userId,
    status: { $ne: 'Hidden' },
  }).select('rating');

  const totalRatings = reviews.length;
  const rating = totalRatings
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalRatings
    : 0;

  await User.findByIdAndUpdate(userId, {
    rating,
    totalRatings,
  });

  return {
    rating: Number(rating.toFixed(2)),
    totalRatings,
  };
};

module.exports = {
  refreshUserRating,
};
