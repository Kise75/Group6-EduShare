const Listing = require('../models/Listing');
const { buildTrustMap } = require('../services/trustService');

const buildRegex = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

// Search and filter listings
const searchListings = async (req, res) => {
  try {
    const { query, category, condition, minPrice, maxPrice, location, sortBy, page, limit } =
      req.query;

    const filter = { status: { $in: ['Active', 'Reserved'] } };
    const andClauses = [];

    if (query) {
      const queryRegex = buildRegex(query);
      andClauses.push({
        $or: [
          { title: { $regex: queryRegex } },
          { description: { $regex: queryRegex } },
          { courseCode: { $regex: queryRegex } },
          { category: { $regex: queryRegex } },
        ],
      });
    }

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
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchListings,
};
