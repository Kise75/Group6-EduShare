const express = require('express');
const {
  banUser,
  getAdminOverview,
  hideListing,
  moderateReview,
  unbanUser,
  unhideListing,
  updateReportStatus,
  updateUserRole,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/overview', getAdminOverview);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/ban', banUser);
router.put('/users/:userId/unban', unbanUser);
router.put('/listings/:listingId/hide', hideListing);
router.put('/listings/:listingId/unhide', unhideListing);
router.put('/reports/:reportId', updateReportStatus);
router.put('/reviews/:reviewId/moderation', moderateReview);

module.exports = router;
