const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Published', 'Hidden'],
      default: 'Published',
    },
    moderationNote: {
      type: String,
      trim: true,
      default: '',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    meetup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meetup',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure one review per transaction (reviewer-reviewee-listing combo)
reviewSchema.index({ listing: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
