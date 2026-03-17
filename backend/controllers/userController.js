const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const { getTrustProfileForUser } = require('../services/trustService');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalize = (value = '') => String(value).trim().toLowerCase();

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  major: user.major,
  role: user.role,
  profileImage: user.profileImage,
  rating: user.rating,
  totalRatings: user.totalRatings,
  emailVerified: user.emailVerified,
  trackedCourseCodes: user.trackedCourseCodes || [],
  preferredMeetupLocations: user.preferredMeetupLocations || [],
});

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, major, profileImage, preferredMeetupLocations } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (major) user.major = major;
    if (profileImage) user.profileImage = profileImage;
    if (Array.isArray(preferredMeetupLocations)) {
      user.preferredMeetupLocations = preferredMeetupLocations.filter(Boolean);
    }

    await user.save();

    res.json({ message: 'Profile updated successfully', user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.userId).select('+password');

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user listings
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.id }).sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user reviews
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserTrust = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const trustProfile = await getTrustProfileForUser(req.params.id);

    res.json({
      user: serializeUser(user),
      trustProfile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit || 8), 1), 20);
    const filter = {
      _id: { $ne: req.userId },
    };

    if (role === 'admin' || role === 'user') {
      filter.role = role;
    }

    if (query) {
      const regex = new RegExp(escapeRegex(query), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    const users = await User.find(filter)
      .select('name email username major role profileImage')
      .sort({ role: 1, name: 1 })
      .limit(Math.max(limit * 3, 12));

    const normalizedQuery = normalize(query);
    const sortedUsers = users
      .map((item) => {
        if (!normalizedQuery) {
          return {
            user: item,
            score: item.role === 'admin' ? 100 : 10,
          };
        }

        const name = normalize(item.name);
        const username = normalize(item.username);
        const email = normalize(item.email);
        const emailLocal = email.split('@')[0] || '';
        const score =
          (name === normalizedQuery ? 120 : 0) +
          (username === normalizedQuery ? 110 : 0) +
          (emailLocal === normalizedQuery ? 110 : 0) +
          (name.startsWith(normalizedQuery) ? 80 : 0) +
          (username.startsWith(normalizedQuery) ? 75 : 0) +
          (emailLocal.startsWith(normalizedQuery) ? 75 : 0) +
          (name.includes(` ${normalizedQuery}`) ? 40 : 0) +
          (name.includes(normalizedQuery) ? 20 : 0) +
          (username.includes(normalizedQuery) ? 20 : 0) +
          (emailLocal.includes(normalizedQuery) ? 15 : 0) +
          (item.role === 'admin' ? 2 : 0);

        return {
          user: item,
          score,
        };
      })
      .sort((left, right) => right.score - left.score || left.user.name.localeCompare(right.user.name))
      .slice(0, limit);

    res.json({
      users: sortedUsers.map((item) => serializeUser(item.user)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  changePassword,
  getUserListings,
  getUserReviews,
  getUserTrust,
  searchUsers,
};
