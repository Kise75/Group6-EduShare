const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { buildTrustMap } = require('../services/trustService');

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'savedListings',
      match: { visibility: { $ne: 'Hidden' } },
      populate: { path: 'seller', select: 'name rating profileImage emailVerified' },
    });

    const sellerIds = (user?.savedListings || []).map((listing) => listing.seller?._id).filter(Boolean);
    const trustMap = await buildTrustMap(sellerIds);
    const notifications = await Notification.find({
      user: req.userId,
      type: { $in: ['wishlist-match', 'price-drop', 'listing-status'] },
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      savedListings: (user?.savedListings || []).map((listing) => ({
        ...(typeof listing.toObject === 'function' ? listing.toObject() : listing),
        sellerInsights: trustMap[String(listing.seller?._id)] || null,
      })),
      trackedCourseCodes: user?.trackedCourseCodes || [],
      preferredMeetupLocations: user?.preferredMeetupLocations || [],
      alertFeed: notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const [user, listing] = await Promise.all([User.findById(req.userId), Listing.findById(listingId)]);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const exists = user.savedListings.some((item) => String(item) === listingId);
    if (!exists) {
      user.savedListings.push(listingId);
      await user.save();
    }

    res.json({ message: 'Listing saved', savedListings: user.savedListings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeSavedListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const user = await User.findById(req.userId);
    user.savedListings = user.savedListings.filter((item) => String(item) !== listingId);
    await user.save();

    res.json({ message: 'Listing removed from wishlist', savedListings: user.savedListings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTrackedCourseCode = async (req, res) => {
  try {
    const { courseCode } = req.body;
    if (!courseCode) {
      return res.status(400).json({ message: 'Course code is required' });
    }

    const normalizedCourseCode = String(courseCode).trim().toUpperCase();
    const user = await User.findById(req.userId);

    if (!user.trackedCourseCodes.includes(normalizedCourseCode)) {
      user.trackedCourseCodes.push(normalizedCourseCode);
      await user.save();
    }

    res.json({
      message: 'Course code tracked',
      trackedCourseCodes: user.trackedCourseCodes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeTrackedCourseCode = async (req, res) => {
  try {
    const normalizedCourseCode = String(req.params.courseCode || '').trim().toUpperCase();
    const user = await User.findById(req.userId);
    user.trackedCourseCodes = user.trackedCourseCodes.filter((item) => item !== normalizedCourseCode);
    await user.save();

    res.json({
      message: 'Tracked course code removed',
      trackedCourseCodes: user.trackedCourseCodes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTrackedCourseCode,
  getWishlist,
  removeSavedListing,
  removeTrackedCourseCode,
  saveListing,
};
