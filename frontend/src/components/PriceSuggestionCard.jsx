import { formatVnd } from "../utils/formatCurrency";

function PriceSuggestionCard({ suggestion, loading = false, error = "" }) {
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
