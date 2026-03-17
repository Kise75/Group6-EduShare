const { CAMPUS_CENTER } = require('../utils/campusLocations');

const CONDITION_WEIGHT = {
  New: 1,
  Good: 0.84,
  Fair: 0.58,
  Poor: 0.26,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toPlain = (item) => (typeof item?.toObject === 'function' ? item.toObject() : item);

const tokenize = (value = '') =>
  String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);

const overlapScore = (leftTokens, rightTokens) => {
  if (!leftTokens.length || !rightTokens.length) {
    return 0;
  }

  const rightSet = new Set(rightTokens);
  const matches = leftTokens.filter((token) => rightSet.has(token)).length;
  return matches / Math.max(leftTokens.length, rightTokens.length);
};

const distanceKm = (left, right) => {
  if (!left?.lat || !left?.lng || !right?.lat || !right?.lng) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((right.lat - left.lat) * Math.PI) / 180;
  const dLng = ((right.lng - left.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((left.lat * Math.PI) / 180) *
      Math.cos((right.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const median = (values) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const normalizeRecency = (date) => {
  if (!date) {
    return 0.3;
  }

  const ageDays = Math.max(0, (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  return clamp(1 - ageDays / 45, 0.1, 1);
};

const buildRecommendationContext = ({
  currentListing = null,
  query = '',
  recentItems = [],
  trackedCourseCodes = [],
  preferredCampusLocation = null,
}) => {
  const plainRecentItems = recentItems.map(toPlain);
  const current = currentListing ? toPlain(currentListing) : null;
  const keywordTokens = tokenize(
    [query, current?.title, current?.description, ...plainRecentItems.map((item) => item.title)].join(' ')
  );
  const courseCodes = [
    ...new Set(
      [current?.courseCode, ...trackedCourseCodes, ...plainRecentItems.map((item) => item.courseCode)]
        .filter(Boolean)
        .map((value) => String(value).toUpperCase())
    ),
  ];
  const categories = [
    ...new Set([current?.category, ...plainRecentItems.map((item) => item.category)].filter(Boolean)),
  ];

  return {
    currentListing: current,
    keywordTokens,
    courseCodes,
    categories,
    recentItems: plainRecentItems,
    preferredCampusLocation: preferredCampusLocation || CAMPUS_CENTER,
  };
};

const scoreRecommendation = (candidate, context, marketStats = {}) => {
  const plainCandidate = toPlain(candidate);
  const candidateTokens = tokenize(
    [plainCandidate.title, plainCandidate.description, plainCandidate.courseCode, plainCandidate.category].join(' ')
  );
  const textScore = overlapScore(candidateTokens, context.keywordTokens);
  const courseCodeScore = context.courseCodes.includes(String(plainCandidate.courseCode || '').toUpperCase())
    ? 1
    : 0;
  const behaviorScore = context.recentItems.length
    ? context.recentItems.reduce((best, item) => {
        const itemTokens = tokenize([item.title, item.description, item.category, item.courseCode].join(' '));
        return Math.max(best, overlapScore(candidateTokens, itemTokens));
      }, 0)
    : 0;
  const conditionScore = CONDITION_WEIGHT[plainCandidate.condition] || 0.45;
  const medianPrice = marketStats.medianPrice || 1;
  const priceDeltaRatio = plainCandidate.price ? (plainCandidate.price - medianPrice) / medianPrice : 0;
  const priceScore = clamp(0.85 - priceDeltaRatio, 0.15, 1);
  const candidateCoordinates = plainCandidate.coordinates || plainCandidate.campusLocation?.coordinates;
  const distance = distanceKm(candidateCoordinates, context.preferredCampusLocation);
  const distanceScore = distance === null ? 0.55 : clamp(1 - distance / 2, 0.15, 1);
  const freshnessScore = normalizeRecency(plainCandidate.createdAt);

  const breakdown = {
    text: textScore * 0.24,
    courseCode: courseCodeScore * 0.2,
    behavior: behaviorScore * 0.17,
    condition: conditionScore * 0.11,
    price: priceScore * 0.12,
    distance: distanceScore * 0.08,
    freshness: freshnessScore * 0.08,
  };

  const totalScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const reasons = [];

  if (courseCodeScore > 0.8) {
    reasons.push(`Matches course code ${plainCandidate.courseCode}`);
  }
  if (textScore > 0.3) {
    reasons.push('Strong keyword relevance');
  }
  if (behaviorScore > 0.35) {
    reasons.push('Similar to recent browsing history');
  }
  if (priceScore > 0.8) {
    reasons.push('Competitive price compared with similar listings');
  }
  if (conditionScore > 0.8) {
    reasons.push(`Condition is ${plainCandidate.condition}`);
  }
  if (distanceScore > 0.7) {
    reasons.push('Meetup point is close to campus center');
  }

  return {
    score: Number((totalScore * 100).toFixed(1)),
    breakdown,
    reasons,
  };
};

const rankRecommendations = (candidates, context) => {
  const plainCandidates = candidates.map(toPlain);
  const medianPrice = median(plainCandidates.map((item) => Number(item.price || 0)).filter(Boolean));

  return plainCandidates
    .map((candidate) => ({
      ...candidate,
      recommendationMeta: scoreRecommendation(candidate, context, { medianPrice }),
    }))
    .sort((left, right) => right.recommendationMeta.score - left.recommendationMeta.score);
};

module.exports = {
  buildRecommendationContext,
  rankRecommendations,
  scoreRecommendation,
};
