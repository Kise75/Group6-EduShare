const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['listing', 'user'],
      required: true,
    },
    targetListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'Reviewed', 'Resolved', 'Dismissed'],
      default: 'Open',
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warning', 'listing-hidden', 'user-banned', 'dismissed'],
      default: 'none',
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
