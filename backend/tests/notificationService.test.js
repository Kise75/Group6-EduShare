const test = require('node:test');
const assert = require('node:assert/strict');

const { createNotificationPayload } = require('../services/notificationService');

test('notification payload keeps routing metadata for downstream UI triggers', () => {
  const payload = createNotificationPayload({
    type: 'wishlist-match',
    title: 'New MATH101 listing',
    message: 'A tracked course code has a new listing.',
    link: '/listing/abc123',
    metadata: {
      listingId: 'abc123',
      courseCode: 'MATH101',
    },
    priority: 'high',
  });

  assert.equal(payload.type, 'wishlist-match');
  assert.equal(payload.link, '/listing/abc123');
  assert.equal(payload.metadata.courseCode, 'MATH101');
  assert.equal(payload.priority, 'high');
});
