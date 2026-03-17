const path = require('path');
const cloudinary = require('cloudinary').v2;
const Listing = require('../models/Listing');
const User = require('../models/User');
const { createNotification, createNotificationPayload, createNotifications } = require('../services/notificationService');
const { LISTING_STATUS, canReserveListing, canTransitionListingStatus } = require('../services/listingRulesService');
const { buildTrustMap } = require('../services/trustService');
const { findCampusLocation } = require('../utils/campusLocations');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const hasCloudinaryConfig =
  process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

const plain = (item) => (typeof item?.toObject === 'function' ? item.toObject() : item);

const mapCampusLocation = (input) => {
  const location = findCampusLocation(input);

  if (!location) {
    return {
      id: '',
      name: '',
      zone: '',
      safetyScore: 0,
      coordinates: {
        lat: null,
        lng: null,
      },
    };
  }

  return {
    id: location.id,
    name: location.name,
    zone: location.zone,
    safetyScore: location.safetyScore,
    coordinates: location.coordinates,
  };
};

const enrichListing = async (listing) => {
  const listingObject = plain(listing);
  const sellerId = listingObject.seller?._id || listingObject.seller;
  const trustMap = await buildTrustMap([sellerId].filter(Boolean));

  return {
    ...listingObject,
    sellerInsights: trustMap[String(sellerId)] || null,
  };
};

const notifyTrackedCourseCodes = async (listing) => {
  if (!listing.courseCode) {
    return;
  }

  const users = await User.find({
    _id: { $ne: listing.seller },
    trackedCourseCodes: String(listing.courseCode).toUpperCase(),
  }).select('_id');

  await createNotifications(
    users.map((user) => user._id.toString()),
    createNotificationPayload({
      type: 'wishlist-match',
      title: `New ${listing.courseCode} listing`,
      message: `${listing.title} matches a course code you follow.`,
      link: `/listing/${listing._id}`,
      metadata: {
        listingId: listing._id.toString(),
        courseCode: listing.courseCode,
      },
    })
  );
};

const notifyPriceDrop = async (listing, oldPrice) => {
  const users = await User.find({
    savedListings: listing._id,
    _id: { $ne: listing.seller },
  }).select('_id');

  await createNotifications(
    users.map((user) => user._id.toString()),
    createNotificationPayload({
      type: 'price-drop',
      title: 'Saved item price dropped',
      message: `${listing.title} dropped from ${oldPrice.toLocaleString('vi-VN')} to ${listing.price.toLocaleString(
        'vi-VN'
      )} VND.`,
      link: `/listing/${listing._id}`,
      metadata: {
        listingId: listing._id.toString(),
        oldPrice,
        newPrice: listing.price,
      },
      priority: 'high',
    })
  );
};

const notifyBackInStock = async (listing) => {
  const users = await User.find({
    savedListings: listing._id,
    _id: { $ne: listing.seller },
  }).select('_id');

  await createNotifications(
    users.map((user) => user._id.toString()),
    createNotificationPayload({
      type: 'listing-status',
      title: 'Saved item is back in stock',
      message: `${listing.title} is available again.`,
      link: `/listing/${listing._id}`,
      metadata: {
        listingId: listing._id.toString(),
        status: listing.status,
      },
    })
  );
};

const getAllListings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const marketplaceFilter = { status: { $in: [LISTING_STATUS.ACTIVE, LISTING_STATUS.RESERVED] } };

    const listings = await Listing.find(marketplaceFilter)
      .populate('seller', 'name rating profileImage emailVerified totalRatings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const trustMap = await buildTrustMap(
      listings.map((listing) => listing.seller?._id).filter(Boolean)
    );
    const total = await Listing.countDocuments(marketplaceFilter);

    res.json({
      listings: listings.map((listing) => ({
        ...plain(listing),
        sellerInsights: trustMap[String(listing.seller?._id)] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      courseCode,
      category,
      condition,
      price,
      edition,
      isbn,
      campusLocation,
    } = req.body;
    const numericPrice = Number(price);

    if (!title || !description || !condition || price === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 1000) {
      return res.status(400).json({ message: 'Price must be at least 1,000 VND' });
    }

    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (hasCloudinaryConfig) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'edushare/listings',
          });
          images.push(result.secure_url);
        } else {
          images.push(`/uploads/${path.basename(file.path)}`);
        }
      }
    }

    const listing = new Listing({
      title,
      description,
      courseCode: courseCode || '',
      category: category || 'Textbooks',
      condition,
      price: numericPrice,
      priceHistory: [{ amount: numericPrice }],
      images,
      seller: req.userId,
      edition: edition || '',
      isbn: isbn || '',
      campusLocation: mapCampusLocation(campusLocation),
    });

    await listing.save();
    await listing.populate('seller', 'name rating profileImage emailVerified totalRatings');
    await notifyTrackedCourseCodes(listing);

    res.status(201).json({
      message: 'Listing created successfully',
      listing: await enrichListing(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name rating profileImage totalRatings emailVerified')
      .populate('reservedBy', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.views += 1;
    await listing.save();

    res.json(await enrichListing(listing));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (String(listing.seller._id || listing.seller) !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const previousPrice = listing.price;
    const previousStatus = listing.status;
    const {
      title,
      description,
      courseCode,
      category,
      condition,
      price,
      edition,
      isbn,
      status,
      campusLocation,
    } = req.body;
    const hasPrice = price !== undefined;
    const numericPrice = Number(price);

    if (hasPrice && (!Number.isFinite(numericPrice) || numericPrice < 1000)) {
      return res.status(400).json({ message: 'Price must be at least 1,000 VND' });
    }

    if (status && !canTransitionListingStatus(listing.status, status)) {
      return res.status(400).json({
        message: `Cannot move listing from ${listing.status} to ${status}`,
      });
    }

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (courseCode) listing.courseCode = courseCode;
    if (category) listing.category = category;
    if (condition) listing.condition = condition;
    if (hasPrice) {
      listing.price = numericPrice;
      if (numericPrice !== previousPrice) {
        listing.priceHistory.push({ amount: numericPrice });
      }
    }
    if (edition !== undefined) listing.edition = edition;
    if (isbn !== undefined) listing.isbn = isbn;
    if (campusLocation !== undefined) listing.campusLocation = mapCampusLocation(campusLocation);
    if (status) {
      listing.status = status;
      if (status === LISTING_STATUS.ACTIVE) {
        listing.reservedBy = null;
        listing.reservedAt = null;
      }
    }

    await listing.save();
    await listing.populate('seller', 'name rating profileImage totalRatings emailVerified');
    await listing.populate('reservedBy', 'name email');

    if (hasPrice && numericPrice < previousPrice) {
      await notifyPriceDrop(listing, previousPrice);
    }

    if (previousStatus === LISTING_STATUS.RESERVED && listing.status === LISTING_STATUS.ACTIVE) {
      await notifyBackInStock(listing);
    }

    res.json({
      message: 'Listing updated successfully',
      listing: await enrichListing(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reserveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const reservationCheck = canReserveListing(listing, req.userId);
    if (!reservationCheck.allowed) {
      return res.status(400).json({ message: reservationCheck.reason });
    }

    listing.status = LISTING_STATUS.RESERVED;
    listing.reservedBy = req.userId;
    listing.reservedAt = new Date();
    await listing.save();

    await createNotification(
      listing.seller._id || listing.seller,
      createNotificationPayload({
        type: 'reservation',
        title: 'New reservation request',
        message: `${listing.title} has been reserved by a buyer.`,
        link: `/listing/${listing._id}`,
        metadata: {
          listingId: listing._id.toString(),
          reservedBy: req.userId,
        },
        priority: 'high',
      })
    );

    await listing.populate('seller', 'name rating profileImage totalRatings emailVerified');
    await listing.populate('reservedBy', 'name email');

    res.json({
      message: 'Listing reserved successfully',
      listing: await enrichListing(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const releaseReservation = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const isOwner = String(listing.seller._id || listing.seller) === req.userId;
    const isReservedBuyer = String(listing.reservedBy || '') === req.userId;

    if (!isOwner && !isReservedBuyer && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to release this reservation' });
    }

    if (listing.status !== LISTING_STATUS.RESERVED) {
      return res.status(400).json({ message: 'Listing is not reserved' });
    }

    const reservedBuyerId = listing.reservedBy ? String(listing.reservedBy) : '';
    listing.status = LISTING_STATUS.ACTIVE;
    listing.reservedBy = null;
    listing.reservedAt = null;
    await listing.save();
    await notifyBackInStock(listing);

    if (reservedBuyerId) {
      await createNotification(
        reservedBuyerId,
        createNotificationPayload({
          type: 'listing-status',
          title: 'Reservation released',
          message: `${listing.title} is available again.`,
          link: `/listing/${listing._id}`,
          metadata: {
            listingId: listing._id.toString(),
            status: listing.status,
          },
        })
      );
    }

    await listing.populate('seller', 'name rating profileImage totalRatings emailVerified');

    res.json({
      message: 'Reservation released',
      listing: await enrichListing(listing),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.userId })
      .populate('seller', 'name rating profileImage totalRatings emailVerified')
      .sort({ createdAt: -1 });

    const trustMap = await buildTrustMap([req.userId]);

    res.json(
      listings.map((listing) => ({
        ...plain(listing),
        sellerInsights: trustMap[req.userId] || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createListing,
  deleteListing,
  getAllListings,
  getListingById,
  getUserListings,
  releaseReservation,
  reserveListing,
  updateListing,
};
