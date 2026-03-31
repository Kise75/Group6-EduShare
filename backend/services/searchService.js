const normalizeSearchText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeSearchText = (value = '') => normalizeSearchText(value).split(' ').filter(Boolean);

const buildListingSearchText = (listing = {}) =>
  normalizeSearchText(
    [
      listing.title,
      listing.description,
      listing.courseCode,
      listing.category,
      listing.campusLocation?.name,
      listing.edition,
      listing.isbn,
    ]
      .filter(Boolean)
      .join(' ')
  );

const levenshteinDistance = (source = '', target = '') => {
  if (source === target) {
    return 0;
  }

  if (!source.length) {
    return target.length;
  }

  if (!target.length) {
    return source.length;
  }

  const previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let row = 1; row <= source.length; row += 1) {
    let upperLeft = previousRow[0];
    previousRow[0] = row;

    for (let column = 1; column <= target.length; column += 1) {
      const current = previousRow[column];
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;

      previousRow[column] = Math.min(
        previousRow[column] + 1,
        previousRow[column - 1] + 1,
        upperLeft + cost
      );

      upperLeft = current;
    }
  }

  return previousRow[target.length];
};

const getAllowedDistance = (length) => {
  if (length <= 4) {
    return 1;
  }

  if (length <= 8) {
    return 2;
  }

  return 3;
};

const getTokenSimilarity = (queryToken, candidateToken) => {
  if (!queryToken || !candidateToken) {
    return { score: 0, direct: false };
  }

  if (candidateToken === queryToken) {
    return { score: 1, direct: true };
  }

  if (candidateToken.startsWith(queryToken)) {
    return { score: 0.95, direct: true };
  }

  if (queryToken.length < 3 || candidateToken.length < 3) {
    return { score: 0, direct: false };
  }

  const maxLength = Math.max(queryToken.length, candidateToken.length);
  const distance = levenshteinDistance(queryToken, candidateToken);

  if (distance > getAllowedDistance(maxLength)) {
    return { score: 0, direct: false };
  }

  return {
    score: Number((1 - distance / maxLength).toFixed(4)),
    direct: false,
  };
};

const scoreListingForSearch = (listing, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenizeSearchText(normalizedQuery);

  if (!queryTokens.length) {
    return { matched: false, score: 0, isDirectMatch: false };
  }

  const titleText = normalizeSearchText(listing?.title || '');
  const courseCodeText = normalizeSearchText(listing?.courseCode || '');
  const searchText = buildListingSearchText(listing);
  const searchTokens = tokenizeSearchText(searchText);
  const titleTokens = tokenizeSearchText(titleText);

  if (!searchTokens.length) {
    return { matched: false, score: 0, isDirectMatch: false };
  }

  let totalScore = 0;
  let directTokenMatches = 0;

  for (const queryToken of queryTokens) {
    let bestScore = 0;
    let hasDirectMatch = false;

    for (const candidateToken of searchTokens) {
      const nextMatch = getTokenSimilarity(queryToken, candidateToken);

      if (nextMatch.score > bestScore) {
        bestScore = nextMatch.score;
        hasDirectMatch = nextMatch.direct;
      } else if (nextMatch.score === bestScore && nextMatch.direct) {
        hasDirectMatch = true;
      }

      if (bestScore === 1 && hasDirectMatch) {
        break;
      }
    }

    if (bestScore === 0) {
      return { matched: false, score: 0, isDirectMatch: false };
    }

    totalScore += bestScore;

    if (hasDirectMatch) {
      directTokenMatches += 1;
    }
  }

  const matchStrength = totalScore / queryTokens.length;

  if (matchStrength < 0.58) {
    return { matched: false, score: 0, isDirectMatch: false };
  }

  let bonus = 0;
  const hasSearchTokenCoverage = directTokenMatches === queryTokens.length;
  const hasTitleTokenCoverage =
    titleTokens.length > 0 &&
    queryTokens.every((queryToken) =>
      titleTokens.some((candidateToken) => candidateToken === queryToken || candidateToken.startsWith(queryToken))
    );

  if (hasSearchTokenCoverage) {
    bonus += 0.8;
  }

  if (hasTitleTokenCoverage) {
    bonus += 0.35;
  }

  if (courseCodeText && (courseCodeText === normalizedQuery || courseCodeText.startsWith(normalizedQuery))) {
    bonus += 0.45;
  }

  return {
    matched: true,
    score: Number((matchStrength + bonus).toFixed(4)),
    isDirectMatch: hasSearchTokenCoverage,
  };
};

module.exports = {
  normalizeSearchText,
  scoreListingForSearch,
};
