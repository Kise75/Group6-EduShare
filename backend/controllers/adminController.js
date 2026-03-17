const User = require('../models/User');
const Listing = require('../models/Listing');
const Meetup = require('../models/Meetup');
const Report = require('../models/Report');
const Review = require('../models/Review');

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  major: user.major,
  role: user.role,
  rating: user.rating,
  totalRatings: user.totalRatings,
  createdAt: user.createdAt,
});

const getAdminOverview = async (req, res) => {
  try {
    const [users, listings, meetupCount, reviewCount, reportCount, reports] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }),
      Listing.find({})
        .populate('seller', 'name email role')
        .sort({ createdAt: -1 }),
      Meetup.countDocuments({}),
      Review.countDocuments({}),
      Report.countDocuments({}),
      Report.find({})
        .populate('reporter', 'name email')
        .populate('targetUser', 'name email')
        .populate('targetListing', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      stats: {
        totalUsers: users.length,
        admins: users.filter((user) => user.role === 'admin').length,
        totalListings: listings.length,
        totalMeetups: meetupCount,
        totalReviews: reviewCount,
        totalReports: reportCount,
      },
      users: users.map(serializeUser),
      listings,
      reports,
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

module.exports = {
  getAdminOverview,
  updateUserRole,
};
