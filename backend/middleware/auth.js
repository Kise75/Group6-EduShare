const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('role status banReason');

    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }

    if (user.status === 'Banned') {
      return res.status(403).json({
        message: user.banReason
          ? `Your account has been suspended: ${user.banReason}`
          : 'Your account has been suspended by an administrator',
      });
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
