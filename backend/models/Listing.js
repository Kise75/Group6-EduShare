const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    courseCode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Textbooks', 'Lab Kits', 'Notes', 'Others'],
      default: 'Textbooks',
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1000,
    },
    priceHistory: [
      {
        amount: {
          type: Number,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    images: [
      {
        type: String,
        default: null,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Reserved', 'Sold'],
      default: 'Active',
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    edition: {
      type: String,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    campusLocation: {
      id: {
        type: String,
        default: '',
      },
      name: {
        type: String,
        default: '',
      },
      zone: {
        type: String,
        default: '',
      },
      safetyScore: {
        type: Number,
        default: 0,
      },
      coordinates: {
        lat: {
          type: Number,
          default: null,
        },
        lng: {
          type: Number,
          default: null,
        },
      },
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
