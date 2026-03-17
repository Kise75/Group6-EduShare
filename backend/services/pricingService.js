const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const tokenize = (value = '') =>
  String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);

const median = (values) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const quartile = (values, ratio) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const removeOutliers = (values) => {
  if (values.length < 4) {
    return values;
  }

  const q1 = quartile(values, 0.25);
  const q3 = quartile(values, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - iqr * 1.5;
  const upper = q3 + iqr * 1.5;
  return values.filter((value) => value >= lower && value <= upper);
};

const computeSimilarity = (draft, listing) => {
  let score = 0;

  if (draft.category && listing.category === draft.category) {
    score += 1.2;
  }

  if (draft.courseCode && listing.courseCode) {
    const draftCode = String(draft.courseCode).toUpperCase();
    const listingCode = String(listing.courseCode).toUpperCase();
    if (draftCode === listingCode) {
      score += 3.2;
    } else if (listingCode.includes(draftCode) || draftCode.includes(listingCode)) {
      score += 1.5;
    }
  }

  if (draft.condition && listing.condition === draft.condition) {
    score += 1.4;
  }

  if (draft.edition && listing.edition) {
    const normalizedDraftEdition = String(draft.edition).toLowerCase();
    const normalizedListingEdition = String(listing.edition).toLowerCase();
    if (normalizedDraftEdition === normalizedListingEdition) {
      score += 1.5;
    } else if (
      normalizedDraftEdition.includes(normalizedListingEdition) ||
      normalizedListingEdition.includes(normalizedDraftEdition)
    ) {
      score += 0.8;
    }
  }

  const titleOverlap = (() => {
    const left = tokenize(draft.title);
    const right = tokenize(listing.title);
    if (!left.length || !right.length) {
      return 0;
    }
    const rightSet = new Set(right);
    return left.filter((token) => rightSet.has(token)).length / Math.max(left.length, right.length);
  })();

  score += titleOverlap * 1.8;

  if (listing.status === 'Sold') {
    score += 0.8;
  }

  return score;
};

const buildPriceSuggestion = (draft, listings) => {
  const enriched = listings
    .map((listing) => ({
      ...listing,
      similarity: computeSimilarity(draft, listing),
    }))
    .filter((item) => item.similarity >= 1.2)
    .sort((left, right) => right.similarity - left.similarity);

  const pool = enriched.length ? enriched.slice(0, 12) : listings.filter((listing) => listing.category === draft.category);
  const prices = removeOutliers(pool.map((item) => Number(item.price || 0)).filter((value) => value >= 1000));
  const medianPrice = median(prices);

  if (!medianPrice) {
    return {
      minPrice: 50000,
      maxPrice: 120000,
      medianPrice: 85000,
      explanation:
        'Suggested price: 50.000 - 120.000 VND based on common student marketplace pricing for similar materials.',
      evidenceCount: 0,
    };
  }

  const conditionModifier =
    draft.condition === 'New' ? 1.08 : draft.condition === 'Good' ? 1 : draft.condition === 'Fair' ? 0.88 : 0.72;
  const adjustedMedian = Math.round((medianPrice * conditionModifier) / 1000) * 1000;
  const minPrice = Math.max(1000, Math.round((adjustedMedian * 0.88) / 1000) * 1000);
  const maxPrice = Math.max(minPrice, Math.round((adjustedMedian * 1.12) / 1000) * 1000);

  const subject = draft.courseCode
    ? `${draft.courseCode} similar listings`
    : draft.category
      ? `${draft.category.toLowerCase()} listings`
      : 'similar student listings';
  const conditionLabel = draft.condition ? `in ${draft.condition.toLowerCase()} condition` : '';

  return {
    minPrice,
    maxPrice,
    medianPrice: adjustedMedian,
    evidenceCount: pool.length,
    explanation: `Suggested price: ${minPrice.toLocaleString('vi-VN')} - ${maxPrice.toLocaleString(
      'vi-VN'
    )} VND based on ${subject} ${conditionLabel}`.trim() + '.',
    matchedListings: pool.slice(0, 5).map((item) => ({
      _id: item._id,
      title: item.title,
      price: item.price,
      status: item.status,
      similarity: Number(item.similarity.toFixed(2)),
    })),
  };
};

module.exports = {
  buildPriceSuggestion,
  computeSimilarity,
  removeOutliers,
};
