const Listing = require('../models/Listing');
const Report = require('../models/Report');
const User = require('../models/User');
const { createNotificationPayload, notifyAdmins } = require('../services/notificationService');

const createReport = async (req, res) => {
  try {
    const { targetType, targetListingId, targetUserId, reason, details } = req.body;

    if (!targetType || !reason) {
      return res.status(400).json({ message: 'Target type and reason are required' });
    }

    if (!['listing', 'user'].includes(targetType)) {
      return res.status(400).json({ message: 'Target type must be listing or user' });
    }

    let listing = null;
    let targetUser = null;

    if (targetType === 'listing') {
      listing = await Listing.findById(targetListingId).populate('seller', 'name');
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      listing.reportCount += 1;
      await listing.save();
      targetUser = listing.seller;
    } else {
      targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    const report = await Report.create({
      reporter: req.userId,
      targetType,
      targetListing: listing?._id || null,
      targetUser: targetUser?._id || null,
      reason,
      details: details || '',
    });

    await notifyAdmins(
      createNotificationPayload({
        type: 'report',
        title: 'New safety report',
        message: `${targetType === 'listing' ? 'Listing' : 'User'} was reported for "${reason}".`,
        link: '/admin',
        metadata: {
          reportId: report._id.toString(),
          targetType,
          targetListingId: listing?._id?.toString() || '',
          targetUserId: targetUser?._id?.toString() || '',
        },
        priority: 'high',
      })
    );

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReport,
};
