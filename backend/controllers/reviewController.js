const Review = require('../models/Review');
const User = require('../models/User');
const Meetup = require('../models/Meetup');
const { createNotification, createNotificationPayload } = require('../services/notificationService');

// Create review
const createReview = async (req, res) => {
  try {
    const { meetupId, rating, comment } = req.body;

    if (!meetupId || !rating) {
      return res.status(400).json({ message: 'Please provide meetup ID and rating' });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find meetup
    const meetup = await Meetup.findById(meetupId);
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    // Check if meetup is completed
    if (meetup.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only review completed transactions' });
    }

    // Determine reviewer and reviewee
    let reviewee;
    if (meetup.buyer.toString() === req.userId) {
      reviewee = meetup.seller;
    } else if (meetup.seller.toString() === req.userId) {
      reviewee = meetup.buyer;
    } else {
      return res.status(403).json({ message: 'Not authorized to create review' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      meetup: meetupId,
      reviewer: req.userId,
      reviewee,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this transaction' });
    }

    // Create review
    const review = new Review({
      listing: meetup.listing,
      reviewer: req.userId,
      reviewee,
      rating,
      comment: comment || '',
      meetup: meetupId,
    });

    await review.save();

    // Update user rating
    const reviews = await Review.find({ reviewee });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(reviewee, {
      rating: avgRating,
      totalRatings: reviews.length,
    });

    await review.populate('reviewer', 'name profileImage');
    await createNotification(
      reviewee,
      createNotificationPayload({
        type: 'review',
        title: 'New review received',
        message: `You received a ${rating}-star review.`,
        link: `/profile`,
        metadata: {
          reviewId: review._id.toString(),
          meetupId,
          rating,
        },
      })
    );

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a user
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if user can review a transaction
const canReview = async (req, res) => {
  try {
    const { meetupId } = req.params;

    const meetup = await Meetup.findById(meetupId);
    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    // Check if user is buyer or seller
    const isParticipant =
      meetup.buyer.toString() === req.userId || meetup.seller.toString() === req.userId;

    if (!isParticipant) {
      return res.json({ canReview: false, reason: 'Not a participant in this transaction' });
    }

    // Check if meetup is completed
    if (meetup.status !== 'Completed') {
      return res.json({ canReview: false, reason: 'Transaction not completed yet' });
    }

    // Check if already reviewed
    const reviewer = req.userId;
    const reviewee =
      meetup.buyer.toString() === req.userId ? meetup.seller : meetup.buyer;

    const existingReview = await Review.findOne({
      meetup: meetupId,
      reviewer,
      reviewee,
    });

    if (existingReview) {
      return res.json({ canReview: false, reason: 'Already reviewed' });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getUserReviews,
  canReview,
};
