import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import {
  localizeCampusLocation,
  localizeCondition,
  localizeRecommendationReason,
  localizeStatus,
} from "../utils/localeHelpers";
import { formatVnd } from "../utils/formatCurrency";
import TrustBadgeList from "./TrustBadgeList";

function ListingCard({
  listing,
  compact = false,
  isAdmin = false,
  onDelete,
  saved = false,
  onToggleSave,
  saveLabel,
}) {
  const { t } = useI18n();
  const image = listing?.images?.[0];

  return (
    <article className={`listing-card ${compact ? "compact" : ""}`}>
      <div className="listing-image-wrap">
        {image ? (
          <img src={image} alt={listing.title} className="listing-image" />
        ) : (
          <div className="placeholder-image">{t("listing.detail.image")}</div>
        )}
      </div>
      <div className="listing-card-topline">
        <span className={`tag status-${String(listing.status || "active").toLowerCase()}`}>
          {localizeStatus(listing.status || "Active", t)}
        </span>
        {listing.sellerInsights?.trustScore ? (
          <span className="trust-score-pill">Trust {listing.sellerInsights.trustScore}/100</span>
        ) : null}
      </div>
      <h3>{listing.title}</h3>
      <p className="meta">
        {t("listing.meta.courseCode")}: {listing.courseCode || t("listing.meta.na")}
      </p>
      <p className="meta">
        {t("listing.meta.condition")}: {localizeCondition(listing.condition || "Good", t)}
      </p>
      {listing.campusLocation?.name ? (
        <p className="meta">
          {t("listing.meta.meetup")}: {localizeCampusLocation(listing.campusLocation.name, t)}
        </p>
      ) : null}
      <p className="price">{formatVnd(listing.price)}</p>
      {listing.sellerInsights?.badges?.length ? (
        <TrustBadgeList badges={listing.sellerInsights.badges} compact />
      ) : null}
      {listing.recommendationMeta?.reasons?.length ? (
        <p className="meta recommendation-reason">
          {localizeRecommendationReason(listing.recommendationMeta.reasons[0], t)}
        </p>
      ) : null}
      <div className="card-actions">
        {onToggleSave ? (
          <button className="btn btn-secondary" type="button" onClick={() => onToggleSave(listing)}>
            {saveLabel || (saved ? t("listing.actions.saved") : t("listing.actions.save"))}
          </button>
        ) : null}
        <Link className="btn btn-primary" to={`/listing/${listing._id}`}>
          {t("listing.actions.viewDetails")}
        </Link>
        {isAdmin ? (
          <>
            <Link className="btn btn-secondary" to={`/listing/${listing._id}/edit`}>
              {t("listing.actions.edit")}
            </Link>
            <button className="btn btn-danger" type="button" onClick={() => onDelete?.(listing)}>
              Delete
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default ListingCard;
