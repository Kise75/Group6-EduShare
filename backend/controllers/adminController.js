const User = require('../models/User');
const Listing = require('../models/Listing');
const Meetup = require('../models/Meetup');
const Report = require('../models/Report');
const Review = require('../models/Review');
const { LISTING_STATUS, LISTING_VISIBILITY } = require('../services/listingRulesService');
const { refreshUserRating } = require('../services/reviewMetricsService');

const plain = (item) => (typeof item?.toObject === 'function' ? item.toObject() : item);

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  major: user.major,
  role: user.role,
  status: user.status || 'Active',
  banReason: user.banReason || '',
  bannedAt: user.bannedAt || null,
  rating: user.rating,
  totalRatings: user.totalRatings,
  createdAt: user.createdAt,
});

const hideListingModeration = async (listing, actorId, reason) => {
  listing.visibility = LISTING_VISIBILITY.HIDDEN;
  listing.hiddenReason = reason || 'Hidden by admin review';
  listing.hiddenAt = new Date();
  listing.hiddenBy = actorId;
  await listing.save();
  return listing;
};

const unhideListingModeration = async (listing) => {
  listing.visibility = LISTING_VISIBILITY.VISIBLE;
  listing.hiddenReason = '';
  listing.hiddenAt = null;
  listing.hiddenBy = null;
  await listing.save();
  return listing;
};

const banUserAccount = async (user, actorId, reason) => {
  const resolvedReason = reason || 'Marketplace policy violation';
  const actionTime = new Date();

  user.status = 'Banned';
  user.banReason = resolvedReason;
  user.bannedAt = actionTime;
  user.bannedBy = actorId;
  await user.save();

  await Listing.updateMany(
    {
      seller: user._id,
      visibility: { $ne: LISTING_VISIBILITY.HIDDEN },
    },
    {
      $set: {
        visibility: LISTING_VISIBILITY.HIDDEN,
        hiddenReason: `Seller account suspended: ${resolvedReason}`,
        hiddenAt: actionTime,
        hiddenBy: actorId,
      },
    }
  );

  return user;
};

const unbanUserAccount = async (user) => {
  user.status = 'Active';
  user.banReason = '';
  user.bannedAt = null;
  user.bannedBy = null;
  await user.save();
  return user;
};

const populateReports = (query) =>
  query
    .populate('reporter', 'name email')
    .populate('targetUser', 'name email role status')
    .populate('targetListing', 'title status visibility seller')
    .populate('resolvedBy', 'name email');

const populateReviews = (query) =>
  query
    .populate('reviewer', 'name email')
    .populate('reviewee', 'name email')
    .populate('listing', 'title')
    .populate('moderatedBy', 'name email');

const getAdminOverview = async (req, res) => {
  try {
    const [users, listings, reports, reviews, totalMeetups, pendingMeetups] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }),
      Listing.find({})
        .populate('seller', 'name email role status')
        .sort({ createdAt: -1 }),
      populateReports(Report.find({}).sort({ createdAt: -1 })),
      populateReviews(Review.find({}).sort({ createdAt: -1 })),
      Meetup.countDocuments({}),
      Meetup.countDocuments({ status: { $in: ['Pending', 'Confirmed'] } }),
    ]);

    const stats = {
      totalUsers: users.length,
      admins: users.filter((user) => user.role === 'admin').length,
      activeUsers: users.filter((user) => (user.status || 'Active') !== 'Banned').length,
      bannedUsers: users.filter((user) => user.status === 'Banned').length,
      totalListings: listings.length,
      activeListings: listings.filter((listing) => listing.status === LISTING_STATUS.ACTIVE).length,
      reservedListings: listings.filter((listing) => listing.status === LISTING_STATUS.RESERVED).length,
      soldListings: listings.filter((listing) => listing.status === LISTING_STATUS.SOLD).length,
      hiddenListings: listings.filter((listing) => listing.visibility === LISTING_VISIBILITY.HIDDEN).length,
      totalMeetups,
      pendingMeetups,
      totalReviews: reviews.length,
      hiddenReviews: reviews.filter((review) => review.status === 'Hidden').length,
      totalReports: reports.length,
      openReports: reports.filter((report) => report.status === 'Open').length,
      reviewedReports: reports.filter((report) => report.status === 'Reviewed').length,
      resolvedReports: reports.filter((report) => report.status === 'Resolved').length,
    };

    res.json({
      stats,
      users: users.map(serializeUser),
      listings: listings.map((listing) => ({
        ...plain(listing),
        visibility: listing.visibility || LISTING_VISIBILITY.VISIBLE,
      })),
      reports: reports.map((report) => plain(report)),
      reviews: reviews.map((review) => ({
        ...plain(review),
        status: review.status || 'Published',
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either user or admin' });
    }

    if (req.userId === userId) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `Role updated to ${role}`,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (req.userId === userId) {
      return res.status(400).json({ message: 'You cannot ban your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await banUserAccount(user, req.userId, reason);

    res.json({
      message: `${user.name} has been banned and their listings were hidden`,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await unbanUserAccount(user);

    res.json({
      message: `${user.name} has been restored`,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const hideListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { reason } = req.body;
    const listing = await Listing.findById(listingId).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    await hideListingModeration(listing, req.userId, reason);

    res.json({
      message: `"${listing.title}" is now hidden from the marketplace`,
      listing: plain(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unhideListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    await unhideListingModeration(listing);

    res.json({
      message: `"${listing.title}" is visible again`,
      listing: plain(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolutionNote, actionTaken = 'none' } = req.body;
    const nextStatus = String(status || '').trim();
    const allowedStatuses = ['Open', 'Reviewed', 'Resolved', 'Dismissed'];
    const allowedActions = ['none', 'warning', 'listing-hidden', 'user-banned', 'dismissed'];

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid report status' });
    }

    if (!allowedActions.includes(actionTaken)) {
      return res.status(400).json({ message: 'Invalid report action' });
    }

    if (nextStatus !== 'Resolved' && ['listing-hidden', 'user-banned'].includes(actionTaken)) {
      return res.status(400).json({
        message: 'Moderation actions can only be applied when resolving a report',
      });
    }

    const report = await Report.findById(reportId)
      .populate('targetListing')
      .populate('targetUser');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (nextStatus === 'Resolved' && actionTaken === 'listing-hidden') {
      if (!report.targetListing) {
        return res.status(400).json({ message: 'This report has no listing to hide' });
      }

      await hideListingModeration(
        report.targetListing,
        req.userId,
        resolutionNote || `Hidden due to report: ${report.reason}`
      );
    }

    if (nextStatus === 'Resolved' && actionTaken === 'user-banned') {
      if (!report.targetUser) {
        return res.status(400).json({ message: 'This report has no user to ban' });
      }

      if (String(report.targetUser._id) === String(req.userId)) {
        return res.status(400).json({ message: 'You cannot ban your own account through reports' });
      }

      await banUserAccount(
        report.targetUser,
        req.userId,
        resolutionNote || `Suspended due to report: ${report.reason}`
      );
    }

    report.status = nextStatus;
    report.actionTaken = nextStatus === 'Dismissed' ? 'dismissed' : actionTaken;
    report.resolutionNote = resolutionNote || '';

    if (nextStatus === 'Resolved' || nextStatus === 'Dismissed') {
      report.resolvedBy = req.userId;
      report.resolvedAt = new Date();
    } else {
      report.resolvedBy = null;
      report.resolvedAt = null;
    }

    await report.save();

    const populated = await populateReports(Report.findById(reportId));
    res.json({
      message: 'Report workflow updated successfully',
      report: plain(populated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationNote } = req.body;
    const nextStatus = String(status || '').trim();

    if (!['Published', 'Hidden'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Review status must be Published or Hidden' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = nextStatus;
    review.moderationNote = moderationNote || '';
    review.moderatedBy = req.userId;
    review.moderatedAt = new Date();
    await review.save();
    await refreshUserRating(review.reviewee);

    const populated = await populateReviews(Review.findById(reviewId));
    res.json({
      message: `Review ${nextStatus === 'Hidden' ? 'hidden' : 'restored'} successfully`,
      review: plain(populated),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  banUser,
  getAdminOverview,
  hideListing,
  moderateReview,
  unbanUser,
  unhideListing,
  updateReportStatus,
  updateUserRole,
};
