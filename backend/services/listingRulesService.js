const LISTING_STATUS = {
  ACTIVE: 'Active',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
};

const LISTING_VISIBILITY = {
  VISIBLE: 'Visible',
  HIDDEN: 'Hidden',
};

const isTerminalStatus = (status) => status === LISTING_STATUS.SOLD;

const canTransitionListingStatus = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === LISTING_STATUS.ACTIVE) {
    return [LISTING_STATUS.RESERVED, LISTING_STATUS.SOLD].includes(nextStatus);
  }

  if (currentStatus === LISTING_STATUS.RESERVED) {
    return [LISTING_STATUS.ACTIVE, LISTING_STATUS.SOLD].includes(nextStatus);
  }

  return false;
};

const canReserveListing = (listing, actorId) => {
  if (!listing || !actorId) {
    return { allowed: false, reason: 'Missing listing or actor' };
  }

  if (String(listing.seller) === String(actorId)) {
    return { allowed: false, reason: 'Sellers cannot reserve their own listing' };
  }

  if (listing.visibility === LISTING_VISIBILITY.HIDDEN) {
    return { allowed: false, reason: 'Hidden listings cannot be reserved' };
  }

  if (listing.status === LISTING_STATUS.SOLD) {
    return { allowed: false, reason: 'Sold listings cannot be reserved' };
  }

  if (listing.status === LISTING_STATUS.RESERVED) {
    return { allowed: false, reason: 'Listing is already reserved' };
  }

  return { allowed: true };
};

module.exports = {
  LISTING_STATUS,
  LISTING_VISIBILITY,
  canReserveListing,
  canTransitionListingStatus,
  isTerminalStatus,
};
