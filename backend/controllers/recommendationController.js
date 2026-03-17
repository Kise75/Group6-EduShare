const Listing = require('../models/Listing');
const User = require('../models/User');
const { buildRecommendationContext, rankRecommendations } = require('../services/recommendationService');
const { buildTrustMap } = require('../services/trustService');
const { findCampusLocation } = require('../utils/campusLocations');

const normalizeListing = (listing, trustMap = {}) => {
  const plainListing = typeof listing.toObject === 'function' ? listing.toObject() : listing;
  const sellerId = plainListing.seller?._id ? String(plainListing.seller._id) : String(plainListing.seller || '');
  return {
    ...plainListing,
    sellerInsights: trustMap[sellerId] || null,
  };
};

const getHomeRecommendations = async (req, res) => {
  try {
    const recentListingIds = req.body?.recentListingIds || [];
    const query = req.body?.query || '';
    const currentUser = req.userId ? await User.findById(req.userId) : null;
    const preferredCampusLocation = findCampusLocation(currentUser?.preferredMeetupLocations?.[0]);

    const [candidates, recentItems] = await Promise.all([
      Listing.find({
        status: 'Active',
        visibility: { $ne: 'Hidden' },
        ...(req.userId ? { seller: { $ne: req.userId } } : {}),
      })
        .populate('seller', 'name rating profileImage emailVerified')
        .sort({ createdAt: -1 })
        .limit(40),
      recentListingIds.length
        ? Listing.find({ _id: { $in: recentListingIds } }).limit(8)
        : Promise.resolve([]),
    ]);

    const context = buildRecommendationContext({
      query,
      recentItems,
      trackedCourseCodes: currentUser?.trackedCourseCodes || [],
      preferredCampusLocation: preferredCampusLocation?.coordinates || null,
    });

    const ranked = rankRecommendations(candidates, context).slice(0, 6);
    const trustMap = await buildTrustMap(
      ranked.map((listing) => listing.seller?._id || listing.seller).filter(Boolean)
    );

    res.json({
      recommendations: ranked.map((listing) => normalizeListing(listing, trustMap)),
      formula:
        'score = text relevance + course code match + browsing behavior + condition + price + distance + freshness',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRelatedRecommendations = async (req, res) => {
  try {
    const { listingId } = req.params;
    const recentListingIds = req.body?.recentListingIds || [];

    const [currentListing, candidates, recentItems, currentUser] = await Promise.all([
      Listing.findById(listingId).populate('seller', 'name rating profileImage emailVerified'),
      Listing.find({
        _id: { $ne: listingId },
        status: 'Active',
        visibility: { $ne: 'Hidden' },
      })
        .populate('seller', 'name rating profileImage emailVerified')
        .sort({ createdAt: -1 })
        .limit(30),
      recentListingIds.length ? Listing.find({ _id: { $in: recentListingIds } }).limit(6) : Promise.resolve([]),
      req.userId ? User.findById(req.userId) : Promise.resolve(null),
    ]);

    if (!currentListing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const context = buildRecommendationContext({
      currentListing,
      recentItems,
      trackedCourseCodes: currentUser?.trackedCourseCodes || [],
      preferredCampusLocation: findCampusLocation(currentUser?.preferredMeetupLocations?.[0])?.coordinates || null,
    });

    const ranked = rankRecommendations(
      candidates.filter(
        (candidate) =>
          candidate.category === currentListing.category || candidate.courseCode === currentListing.courseCode
      ),
      context
    ).slice(0, 4);

    const trustMap = await buildTrustMap(
      ranked.map((listing) => listing.seller?._id || listing.seller).filter(Boolean)
    );

    res.json({
      listing: normalizeListing(currentListing),
      relatedListings: ranked.map((listing) => normalizeListing(listing, trustMap)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHomeRecommendations,
  getRelatedRecommendations,
};
