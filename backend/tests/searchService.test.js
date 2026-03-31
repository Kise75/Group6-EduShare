const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeSearchText, scoreListingForSearch } = require('../services/searchService');

const artListing = {
  title: 'Art History Study Pack',
  description: 'Printed slides, annotated timeline, and museum summary sheets.',
  courseCode: 'ART210',
  category: 'Notes',
  campusLocation: {
    name: 'Student Support Center',
  },
};

const physicsListing = {
  title: 'Physics Notes',
  description: 'Neat handwritten notes for Physics 101 with solved examples.',
  courseCode: 'PHYS100',
  category: 'Notes',
  campusLocation: {
    name: 'Gate A - 3/2 Street',
  },
};

test('normalizeSearchText removes accents and punctuation', () => {
  assert.equal(normalizeSearchText('  Artt!!! Tai lieu  '), 'artt tai lieu');
});

test('scoreListingForSearch keeps direct matches strong', () => {
  const match = scoreListingForSearch(artListing, 'art');

  assert.equal(match.matched, true);
  assert.equal(match.isDirectMatch, true);
  assert.ok(match.score > 1);
});

test('scoreListingForSearch matches small typos against product titles', () => {
  const match = scoreListingForSearch(artListing, 'arrt');

  assert.equal(match.matched, true);
  assert.equal(match.isDirectMatch, false);
  assert.ok(match.score >= 0.7);
});

test('scoreListingForSearch rejects unrelated listings', () => {
  const match = scoreListingForSearch(physicsListing, 'arrt');

  assert.equal(match.matched, false);
  assert.equal(match.score, 0);
});
