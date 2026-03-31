const Listing = require('../models/Listing');
const { buildTrustMap } = require('../services/trustService');
const { scoreListingForSearch } = require('../services/searchService');

const buildRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const compareCreatedAtDesc = (left, right) =>
  new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();

const sortMatchedListings = (left, right, sortBy) => {
  if (sortBy === 'price-low') {
    return (
      (left.listing?.price || 0) - (right.listing?.price || 0) ||
      right.match.score - left.match.score ||
      compareCreatedAtDesc(left.listing, right.listing)
    );
  }

  if (sortBy === 'price-high') {
    return (
      (right.listing?.price || 0) - (left.listing?.price || 0) ||
      right.match.score - left.match.score ||
      compareCreatedAtDesc(left.listing, right.listing)
    );
  }

  if (sortBy === 'newest') {
    return (
      compareCreatedAtDesc(left.listing, right.listing) ||
      right.match.score - left.match.score
    );
  }

  return right.match.score - left.match.score || compareCreatedAtDesc(left.listing, right.listing);
};

// Search and filter listings
const searchListings = async (req, res) => {
  try {
    const { query, category, condition, minPrice, maxPrice, location, sortBy, page, limit } =
      req.query;

    const filter = {
      status: { $in: ['Active', 'Reserved'] },
      visibility: { $ne: 'Hidden' },
    };
    const andClauses = [];

    if (location) {
      const locationRegex = buildRegex(location);
      andClauses.push({
        $or: [
          { title: { $regex: locationRegex } },
          { description: { $regex: locationRegex } },
          { courseCode: { $regex: locationRegex } },
          { 'campusLocation.name': { $regex: locationRegex } },
        ],
      });
    }

    if (andClauses.length) {
      filter.$and = andClauses;
    }

    if (category) {
      filter.category = category;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (query) {
      const listings = await Listing.find(filter).populate(
        'seller',
        'name rating profileImage emailVerified totalRatings'
      );

      const scoredListings = listings
        .map((listing) => ({
          listing,
          match: scoreListingForSearch(
            typeof listing.toObject === 'function' ? listing.toObject() : listing,
            query
          ),
        }))
        .filter((entry) => entry.match.matched);

      const directMatches = scoredListings.filter((entry) => entry.match.isDirectMatch);
      const matchedListings = (directMatches.length ? directMatches : scoredListings).sort((left, right) =>
        sortMatchedListings(left, right, sortBy)
      );
      const paginatedMatches = matchedListings
        .slice(skip, skip + limitNum)
        .map((entry) => entry.listing);
      const trustMap = await buildTrustMap(
        paginatedMatches.map((listing) => listing.seller?._id).filter(Boolean)
      );

      return res.json({
        listings: paginatedMatches.map((listing) => ({
          ...(typeof listing.toObject === 'function' ? listing.toObject() : listing),
          sellerInsights: trustMap[String(listing.seller?._id)] || null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: matchedListings.length,
          pages: Math.ceil(matchedListings.length / limitNum) || 1,
        },
        searchMeta: {
          usedFuzzy: directMatches.length === 0 && matchedListings.length > 0,
        },
      });
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'price-low') {
      sort = { price: 1 };
    } else if (sortBy === 'price-high') {
      sort = { price: -1 };
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    }

    const listings = await Listing.find(filter)
      .populate('seller', 'name rating profileImage emailVerified totalRatings')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    const trustMap = await buildTrustMap(listings.map((listing) => listing.seller?._id).filter(Boolean));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings: listings.map((listing) => ({
        ...(typeof listing.toObject === 'function' ? listing.toObject() : listing),
        sellerInsights: trustMap[String(listing.seller?._id)] || null,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      searchMeta: {
        usedFuzzy: false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchListings,
};
