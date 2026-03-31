const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeTrackedCourseCodes } = require('../services/authService');

test('normalizeTrackedCourseCodes trims, uppercases, deduplicates, and limits tracked codes', () => {
  const result = normalizeTrackedCourseCodes([
    ' math101 ',
    'cs101',
    'MATH101',
    '',
    'stat201',
    'phys100',
    'chem205',
    'art210',
    'engr120',
  ]);

  assert.deepEqual(result, ['MATH101', 'CS101', 'STAT201', 'PHYS100', 'CHEM205', 'ART210']);
});
