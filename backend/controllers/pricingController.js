const Listing = require('../models/Listing');
const { buildPriceSuggestion } = require('../services/pricingService');

const getPriceSuggestion = async (req, res) => {
  try {
    const draft = {
      title: req.body?.title || '',
      category: req.body?.category || '',
      condition: req.body?.condition || '',
      courseCode: req.body?.courseCode || '',
      edition: req.body?.edition || '',
    };

    const listings = await Listing.find({
      category: draft.category || { $exists: true },
      visibility: { $ne: 'Hidden' },
    })
      .select('title category condition courseCode edition price status')
      .sort({ createdAt: -1 })
      .limit(60);

    const suggestion = buildPriceSuggestion(
      draft,
      listings.map((listing) => (typeof listing.toObject === 'function' ? listing.toObject() : listing))
    );

    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPriceSuggestion,
};
