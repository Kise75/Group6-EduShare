const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRecommendationContext, scoreRecommendation } = require('../services/recommendationService');

test('recommendation scoring rewards matching course code and relevant keywords', () => {
  const context = buildRecommendationContext({
    query: 'calculus textbook',
    trackedCourseCodes: ['MATH101'],
    recentItems: [{ title: 'Calculus Workbook', courseCode: 'MATH101', category: 'Textbooks' }],
  });

  const strongMatch = scoreRecommendation(
    {
      title: 'Calculus Textbook',
      description: 'Used textbook for MATH101 students',
      category: 'Textbooks',
      courseCode: 'MATH101',
      condition: 'Good',
      price: 120000,
      createdAt: new Date().toISOString(),
    },
    context,
    { medianPrice: 150000 }
  );

  const weakMatch = scoreRecommendation(
    {
      title: 'Biology Lab Kit',
      description: 'For first-year bio lab',
      category: 'Lab Kits',
      courseCode: 'BIO101',
      condition: 'Fair',
      price: 220000,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    context,
    { medianPrice: 150000 }
  );

  assert.ok(strongMatch.score > weakMatch.score);
  assert.ok(strongMatch.reasons.some((reason) => reason.includes('course code')));
});
