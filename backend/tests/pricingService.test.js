const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPriceSuggestion, removeOutliers } = require('../services/pricingService');

test('pricing suggestion removes outliers and builds a reasonable range', () => {
  const sample = [80000, 85000, 90000, 95000, 400000];
  const cleaned = removeOutliers(sample);
  assert.equal(cleaned.includes(400000), false);

  const suggestion = buildPriceSuggestion(
    {
      title: 'Calculus Textbook',
      category: 'Textbooks',
      condition: 'Good',
      courseCode: 'MATH101',
      edition: '8th Edition',
    },
    [
      { _id: '1', title: 'Calculus 8th Edition', category: 'Textbooks', condition: 'Good', courseCode: 'MATH101', edition: '8th Edition', price: 120000, status: 'Sold' },
      { _id: '2', title: 'Calculus Workbook', category: 'Textbooks', condition: 'Good', courseCode: 'MATH101', edition: '8th Edition', price: 135000, status: 'Completed' },
      { _id: '3', title: 'Linear Algebra Textbook', category: 'Textbooks', condition: 'Good', courseCode: 'MATH205', edition: '2nd Edition', price: 160000, status: 'Active' },
    ]
  );

  assert.ok(suggestion.minPrice >= 1000);
  assert.ok(suggestion.maxPrice >= suggestion.minPrice);
  assert.ok(suggestion.explanation.includes('Suggested price'));
});
