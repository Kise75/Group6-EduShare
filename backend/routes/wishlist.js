const express = require('express');
const {
  addTrackedCourseCode,
  getWishlist,
  removeSavedListing,
  removeTrackedCourseCode,
  saveListing,
} = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/listings/:listingId', saveListing);
router.delete('/listings/:listingId', removeSavedListing);
router.post('/course-codes', addTrackedCourseCode);
router.delete('/course-codes/:courseCode', removeTrackedCourseCode);

module.exports = router;
