const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('role status');

    if (!user || user.status === 'Banned') {
      return next();
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    return next();
  } catch (error) {
    return next();
  }
};

module.exports = optionalAuth;
