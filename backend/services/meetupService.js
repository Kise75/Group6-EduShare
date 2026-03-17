const { CAMPUS_LOCATIONS, findCampusLocation } = require('../utils/campusLocations');

const normalize = (value) => String(value || '').trim().toLowerCase();

const rankMeetupLocations = ({ buyerPreferences = [], sellerPreferences = [], listingLocation = null }) => {
  const buyerSet = new Set((buyerPreferences || []).map((value) => normalize(value)));
  const sellerSet = new Set((sellerPreferences || []).map((value) => normalize(value)));
  const preferredListingLocation = findCampusLocation(listingLocation?.id || listingLocation?.name || listingLocation);

  return CAMPUS_LOCATIONS.map((location) => {
    const labels = [location.name, ...(location.aliases || [])].map((value) => normalize(value));
    const buyerPreference = labels.some((label) => buyerSet.has(label)) ? 0.6 : 0;
    const sellerPreference = labels.some((label) => sellerSet.has(label)) ? 0.6 : 0;
    const sharedPreference =
      buyerPreference > 0 && sellerPreference > 0 ? 1 : 0;
    const listingBias = preferredListingLocation?.id === location.id ? 0.8 : 0;
    const score = Number((location.safetyScore * 2 + sharedPreference + buyerPreference + sellerPreference + listingBias).toFixed(2));

    const reason = sharedPreference
      ? 'Preferred by both buyer and seller'
      : listingBias
        ? 'Closest to the listing preferred meetup spot'
        : buyerPreference || sellerPreference
          ? 'Matches one user preferred campus zone'
          : 'Safe campus meetup point';

    return {
      id: location.id,
      name: location.name,
      score,
      reason,
      aliases: location.aliases || [],
      coordinates: location.coordinates,
      description: location.description,
      zone: location.zone,
      safetyScore: location.safetyScore,
    };
  }).sort((left, right) => right.score - left.score);
};

module.exports = {
  rankMeetupLocations,
};
