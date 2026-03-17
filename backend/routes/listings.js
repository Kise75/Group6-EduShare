const express = require('express');
const {
  getAllListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings,
  reserveListing,
  releaseReservation,
} = require('../controllers/listingController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getAllListings);
router.get('/user/listings', authMiddleware, getUserListings);
router.get('/:id', getListingById);

// Protected routes
router.post('/', authMiddleware, upload.array('images', 5), createListing);
router.post('/:id/reserve', authMiddleware, reserveListing);
router.post('/:id/release', authMiddleware, releaseReservation);
router.put('/:id', authMiddleware, updateListing);
router.delete('/:id', authMiddleware, deleteListing);

module.exports = router;
