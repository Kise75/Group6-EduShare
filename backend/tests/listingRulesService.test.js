const test = require('node:test');
const assert = require('node:assert/strict');

const { LISTING_STATUS, canReserveListing, canTransitionListingStatus } = require('../services/listingRulesService');

test('listing status transitions follow reservation workflow', () => {
  assert.equal(canTransitionListingStatus(LISTING_STATUS.ACTIVE, LISTING_STATUS.RESERVED), true);
  assert.equal(canTransitionListingStatus(LISTING_STATUS.RESERVED, LISTING_STATUS.ACTIVE), true);
  assert.equal(canTransitionListingStatus(LISTING_STATUS.RESERVED, LISTING_STATUS.SOLD), true);
  assert.equal(canTransitionListingStatus(LISTING_STATUS.SOLD, LISTING_STATUS.ACTIVE), false);
});

test('sold listings cannot be reserved again', () => {
  const soldListing = {
    seller: 'seller-1',
    status: LISTING_STATUS.SOLD,
  };

  const result = canReserveListing(soldListing, 'buyer-1');
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Sold listings/);
});
