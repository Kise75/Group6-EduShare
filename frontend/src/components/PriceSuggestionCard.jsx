import { formatVnd } from "../utils/formatCurrency";

const getPriceStatus = (currentPrice, suggestion) => {
  const numericPrice = Number(currentPrice);

  if (!suggestion || !Number.isFinite(numericPrice) || numericPrice < 1000) {
    return null;
  }

  if (numericPrice < suggestion.minPrice) {
    return {
      tone: "warning",
      message: "Your current price is below the suggested range. It may attract buyers quickly but could undersell the item.",
    };
  }

  if (numericPrice > suggestion.maxPrice) {
    return {
      tone: "warning",
      message: "Your current price is above the suggested range. Buyers may compare it against cheaper similar listings.",
    };
  }

  const midpointGap = Math.abs(numericPrice - suggestion.medianPrice);
  if (midpointGap <= 5000) {
    return {
      tone: "success",
      message: "Your current price sits very close to the suggested midpoint.",
    };
  }

  return {
    tone: "info",
    message: "Your current price is within the suggested market range.",
  };
};

function PriceSuggestionCard({
  suggestion,
  loading = false,
  error = "",
  currentPrice = "",
  onApplyPrice,
}) {
  const priceStatus = getPriceStatus(currentPrice, suggestion);

  return (
    <div className="price-suggestion-card">
      <div className="section-head">
        <div>
          <h3>Smart Price Suggestion</h3>
          <p className="muted">Live pricing guidance from similar completed and active listings.</p>
        </div>
      </div>

      {loading ? <p className="muted">Calculating suggested range...</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      {suggestion ? (
        <>
          <div className="price-range-display">
            <strong>{formatVnd(suggestion.minPrice)}</strong>
            <span>to</span>
            <strong>{formatVnd(suggestion.maxPrice)}</strong>
          </div>
          <p className="muted">Suggested midpoint: {formatVnd(suggestion.medianPrice)}</p>
          {onApplyPrice ? (
            <div className="price-apply-grid">
              <button type="button" className="btn btn-secondary" onClick={() => onApplyPrice(suggestion.minPrice)}>
                Use Lower
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onApplyPrice(suggestion.medianPrice)}>
                Use Midpoint
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onApplyPrice(suggestion.maxPrice)}>
                Use Upper
              </button>
            </div>
          ) : null}
          {priceStatus ? <p className={`price-status-note ${priceStatus.tone}`}>{priceStatus.message}</p> : null}
          <p>{suggestion.explanation}</p>
          <p className="muted">
            Evidence set: {suggestion.evidenceCount || 0} similar listing
            {suggestion.evidenceCount === 1 ? "" : "s"}.
          </p>

          {suggestion.matchedListings?.length ? (
            <div className="price-evidence-list">
              {suggestion.matchedListings.map((item) => (
                <div key={item._id || `${item.title}-${item.price}`} className="price-evidence-item">
                  <strong>{item.title}</strong>
                  <span>{formatVnd(item.price)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default PriceSuggestionCard;
