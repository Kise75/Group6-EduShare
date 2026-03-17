import ListingCard from "./ListingCard";
import { useI18n } from "../context/I18nContext";

function RecommendationSection({ title, description, listings = [], emptyMessage = "No recommendations yet." }) {
  const { t } = useI18n();

  return (
    <section className="recommendation-section">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>

      {listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} compact />
          ))}
        </div>
      ) : (
        <div className="empty-block">
          <p>{emptyMessage || t("listing.detail.relatedEmpty")}</p>
        </div>
      )}
    </section>
  );
}

export default RecommendationSection;
