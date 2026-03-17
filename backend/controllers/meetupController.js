const Listing = require('../models/Listing');
const Meetup = require('../models/Meetup');
const User = require('../models/User');
const { createNotification, createNotificationPayload } = require('../services/notificationService');
const { rankMeetupLocations } = require('../services/meetupService');
const { LISTING_STATUS } = require('../services/listingRulesService');
const { CAMPUS_LOCATIONS, findCampusLocation } = require('../utils/campusLocations');

const plain = (item) => (typeof item?.toObject === 'function' ? item.toObject() : item);

const populateMeetup = (query) =>
  query
    .populate('listing', 'title price courseCode status campusLocation reservedBy')
    .populate('buyer', 'name email profileImage preferredMeetupLocations')
    .populate('seller', 'name email profileImage preferredMeetupLocations');

const getCampusLocations = async (req, res) => {
  try {
    res.json(CAMPUS_LOCATIONS);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetupSuggestions = async (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId).populate('seller', 'preferredMeetupLocations');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const buyer =
      listing.reservedBy && req.userId
        ? await User.findById(listing.reservedBy).select('preferredMeetupLocations')
        : req.userId
          ? await User.findById(req.userId).select('preferredMeetupLocations')
          : null;

    const suggestions = rankMeetupLocations({
      buyerPreferences: buyer?.preferredMeetupLocations || [],
      sellerPreferences: listing.seller?.preferredMeetupLocations || [],
      listingLocation: listing.campusLocation,
    });

    res.json({
      suggestions,
      listingLocation: listing.campusLocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyHistory = async (req, res) => {
  try {
    const history = await populateMeetup(
      Meetup.find({
        $or: [{ buyer: req.userId }, { seller: req.userId }],
      }).sort({ date: -1, createdAt: -1 })
    );

    res.json(history.map((item) => plain(item)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetup = async (req, res) => {
  try {
    const { listingId } = req.params;
    const meetup = await populateMeetup(Meetup.findOne({ listing: listingId }));

    if (!meetup) {
      return res.json(null);
    }

    res.json(plain(meetup));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveParticipants = async (listing, requesterId) => {
  const isSeller = String(listing.seller) === String(requesterId);
  const reservedBuyerId = listing.reservedBy ? String(listing.reservedBy) : '';

  if (!isSeller) {
    return {
      buyerId: requesterId,
      sellerId: listing.seller,
    };
  }

  if (reservedBuyerId) {
    return {
      buyerId: reservedBuyerId,
      sellerId: requesterId,
    };
  }

  return null;
};

const createMeetup = async (req, res) => {
  try {
    const { listingId, location, date, time } = req.body;

    if (!listingId || !location || !date || !time) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const participants = await resolveParticipants(listing, req.userId);
    if (!participants) {
      return res.status(400).json({
        message: 'A meetup can only be proposed after a buyer has reserved the listing or started the request.',
      });
    }

    const [buyer, seller] = await Promise.all([
      User.findById(participants.buyerId).select('preferredMeetupLocations'),
      User.findById(participants.sellerId).select('preferredMeetupLocations'),
    ]);
    const selectedLocation = findCampusLocation(location);
    const suggestions = rankMeetupLocations({
      buyerPreferences: buyer?.preferredMeetupLocations || [],
      sellerPreferences: seller?.preferredMeetupLocations || [],
      listingLocation: listing.campusLocation,
    });

    let meetup = await Meetup.findOne({ listing: listingId });

    if (meetup) {
      if (String(meetup.buyer) !== String(participants.buyerId) || String(meetup.seller) !== String(participants.sellerId)) {
        return res.status(400).json({ message: 'Meetup participants do not match the current reservation' });
      }

      meetup.location = selectedLocation?.name || location;
      meetup.locationId = selectedLocation?.id || '';
      meetup.date = date;
      meetup.time = time;
      meetup.status = 'Pending';
      meetup.buyerConfirmed = false;
      meetup.sellerConfirmed = false;
      meetup.confirmedAt = null;
      meetup.suggestedLocations = suggestions.slice(0, 4).map(({ id, name, score, reason }) => ({
        id,
        name,
        score,
        reason,
      }));
    } else {
      meetup = new Meetup({
        listing: listingId,
        buyer: participants.buyerId,
        seller: participants.sellerId,
        location: selectedLocation?.name || location,
        locationId: selectedLocation?.id || '',
        date,
        time,
        status: 'Pending',
        buyerConfirmed: false,
        sellerConfirmed: false,
        suggestedLocations: suggestions.slice(0, 4).map(({ id, name, score, reason }) => ({
          id,
          name,
          score,
          reason,
        })),
      });
    }

    if (String(participants.buyerId) === String(req.userId)) {
      meetup.buyerConfirmed = true;
    }
    if (String(participants.sellerId) === String(req.userId)) {
      meetup.sellerConfirmed = true;
    }
    if (meetup.buyerConfirmed && meetup.sellerConfirmed) {
      meetup.status = 'Confirmed';
      meetup.confirmedAt = new Date();
    }

    await meetup.save();
    meetup = await populateMeetup(Meetup.findById(meetup._id));

    const counterpartyId =
      String(participants.buyerId) === String(req.userId) ? String(participants.sellerId) : String(participants.buyerId);
    await createNotification(
      counterpartyId,
      createNotificationPayload({
        type: 'meetup',
        title: 'Meetup proposal updated',
        message: `${plain(meetup).listing?.title || 'A listing'} meetup was proposed for ${new Date(date).toLocaleDateString(
          'vi-VN'
        )} at ${time}.`,
        link: `/meetup/${listingId}`,
        metadata: {
          meetupId: meetup._id.toString(),
          listingId,
          status: meetup.status,
        },
        priority: 'high',
      })
    );

    res.status(201).json({ message: 'Meetup scheduled successfully', meetup: plain(meetup) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmMeetup = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const meetup = await Meetup.findById(meetupId);

    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    const isBuyer = String(meetup.buyer) === String(req.userId);
    const isSeller = String(meetup.seller) === String(req.userId);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (meetup.status === 'Cancelled' || meetup.status === 'Completed') {
      return res.status(400).json({ message: `Cannot confirm a ${meetup.status.toLowerCase()} meetup` });
    }

    if (isBuyer) {
      meetup.buyerConfirmed = true;
    }
    if (isSeller) {
      meetup.sellerConfirmed = true;
    }

    if (meetup.buyerConfirmed && meetup.sellerConfirmed) {
      meetup.status = 'Confirmed';
      meetup.confirmedAt = new Date();
    }

    await meetup.save();
    const populated = await populateMeetup(Meetup.findById(meetupId));
    const counterpartyId = isBuyer ? meetup.seller : meetup.buyer;

    await createNotification(
      counterpartyId,
      createNotificationPayload({
        type: 'meetup',
        title: 'Meetup confirmation updated',
        message: populated.status === 'Confirmed' ? 'Both sides confirmed the meetup.' : 'One participant confirmed the meetup.',
        link: `/meetup/${meetup.listing}`,
        metadata: {
          meetupId: meetup._id.toString(),
          listingId: meetup.listing.toString(),
          status: meetup.status,
        },
      })
    );

    res.json({ message: 'Meetup confirmation saved', meetup: plain(populated) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeMeetup = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const meetup = await Meetup.findById(meetupId);

    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    if (String(meetup.buyer) !== String(req.userId) && String(meetup.seller) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    meetup.status = 'Completed';
    meetup.completedAt = new Date();
    await meetup.save();

    const listing = await Listing.findById(meetup.listing);
    if (listing) {
      listing.status = LISTING_STATUS.SOLD;
      await listing.save();
    }

    const counterpartyId = String(meetup.buyer) === String(req.userId) ? meetup.seller : meetup.buyer;
    await createNotification(
      counterpartyId,
      createNotificationPayload({
        type: 'meetup',
        title: 'Meetup marked as completed',
        message: 'You can now leave a review for this transaction.',
        link: '/transactions',
        metadata: {
          meetupId: meetup._id.toString(),
          listingId: meetup.listing.toString(),
          status: meetup.status,
        },
      })
    );

    const populated = await populateMeetup(Meetup.findById(meetupId));
    res.json({ message: 'Meetup completed successfully', meetup: plain(populated) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelMeetup = async (req, res) => {
  try {
    const { meetupId } = req.params;
    const meetup = await Meetup.findById(meetupId);

    if (!meetup) {
      return res.status(404).json({ message: 'Meetup not found' });
    }

    if (String(meetup.buyer) !== String(req.userId) && String(meetup.seller) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    meetup.status = 'Cancelled';
    meetup.buyerConfirmed = false;
    meetup.sellerConfirmed = false;
    await meetup.save();

    const listing = await Listing.findById(meetup.listing);
    if (listing && listing.status === LISTING_STATUS.RESERVED) {
      listing.status = LISTING_STATUS.ACTIVE;
      listing.reservedBy = null;
      listing.reservedAt = null;
      await listing.save();
    }

    const counterpartyId = String(meetup.buyer) === String(req.userId) ? meetup.seller : meetup.buyer;
    await createNotification(
      counterpartyId,
      createNotificationPayload({
        type: 'meetup',
        title: 'Meetup was cancelled',
        message: 'The meetup schedule was cancelled and the listing may be available again.',
        link: `/listing/${meetup.listing}`,
        metadata: {
          meetupId: meetup._id.toString(),
          listingId: meetup.listing.toString(),
          status: meetup.status,
        },
        priority: 'high',
      })
    );

    const populated = await populateMeetup(Meetup.findById(meetupId));
    res.json({ message: 'Meetup cancelled successfully', meetup: plain(populated) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  cancelMeetup,
  completeMeetup,
  confirmMeetup,
  createMeetup,
  getCampusLocations,
  getMeetup,
  getMeetupSuggestions,
  getMyHistory,
};
