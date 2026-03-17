import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import RecommendationSection from "../components/RecommendationSection";
import TrustBadgeList from "../components/TrustBadgeList";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";
import {
  localizeCampusLocation,
  localizeCondition,
  localizeStatus,
} from "../utils/localeHelpers";
import { formatVnd } from "../utils/formatCurrency";
import { getRecentItems, isSavedItem, pushRecentItem, toggleSavedItem } from "../utils/itemCollections";

const initialReportForm = {
  reason: "Spam or duplicate",
  details: "",
};

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [listing, setListing] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [relatedListings, setRelatedListings] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState(initialReportForm);

  useEffect(() => {
    const fetchDetail = async () => {
      setError("");
      try {
        const recentItems = getRecentItems();
        const [listingResponse, relatedResponse, wishlistResponse] = await Promise.all([
          api.get(`/listings/${id}`),
          api.post(`/recommendations/related/${id}`, {
            recentListingIds: recentItems.map((item) => item._id),
          }),
          isAuthenticated ? api.get("/wishlist") : Promise.resolve(null),
        ]);

        const nextListing = listingResponse.data;
        setListing(nextListing);
        setActiveImage(nextListing.images?.[0] || "");
        setRelatedListings(relatedResponse.data.relatedListings || []);
        pushRecentItem(nextListing);

        if (wishlistResponse) {
          setSaved(
            (wishlistResponse.data.savedListings || []).some((item) => item._id === nextListing._id)
          );
        } else {
          setSaved(isSavedItem(nextListing._id));
        }
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot load listing detail"));
      }
    };

    fetchDetail();
  }, [id, isAuthenticated]);

  const isOwner = useMemo(() => {
    if (!listing || !user) {
      return false;
    }
    return listing.seller?._id === user.id;
  }, [listing, user]);

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: `/listing/${id}` } });
      return;
    }

    try {
      const response = await api.post("/messages/start", {
        listingId: listing._id,
        sellerId: listing.seller?._id,
      });
      navigate(`/messages?conversation=${response.data._id}`);
    } catch (requestError) {
      setInfo(parseApiError(requestError, "Cannot start conversation"));
    }
  };

  const handleToggleSave = async () => {
    if (!listing) {
      return;
    }

    setSaving(true);
    setInfo("");

    try {
      if (isAuthenticated) {
        if (saved) {
          await api.delete(`/wishlist/listings/${listing._id}`);
          setSaved(false);
          setInfo("Removed from wishlist.");
        } else {
          await api.post(`/wishlist/listings/${listing._id}`);
          setSaved(true);
          setInfo("Added to wishlist and alerts.");
        }
      } else {
        const result = toggleSavedItem(listing);
        setSaved(result.saved);
        setInfo(result.saved ? "Saved locally." : "Removed from saved items.");
      }
    } catch (requestError) {
      setInfo(parseApiError(requestError, "Cannot update wishlist"));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setInfo("Listing link copied.");
    } catch (shareError) {
      setInfo("Could not copy link automatically.");
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate("/auth", { state: { from: `/listing/${id}` } });
      return;
    }

    try {
      const response = await api.post(`/listings/${listing._id}/reserve`);
      setListing(response.data.listing);
      setInfo(response.data.message || "Listing reserved.");
    } catch (requestError) {
      setInfo(parseApiError(requestError, "Cannot reserve listing"));
    }
  };

  const handleRelease = async () => {
    try {
      const response = await api.post(`/listings/${listing._id}/release`);
      setListing(response.data.listing);
      setInfo(response.data.message || "Reservation released.");
    } catch (requestError) {
      setInfo(parseApiError(requestError, "Cannot release reservation"));
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setInfo("");

    try {
      const response = await api.post("/reports", {
        targetType: "listing",
        targetListingId: listing._id,
        reason: reportForm.reason,
        details: reportForm.details,
      });
      setInfo(response.data.message || "Report submitted.");
      setShowReport(false);
      setReportForm(initialReportForm);
    } catch (requestError) {
      setInfo(parseApiError(requestError, "Cannot submit report"));
    }
  };

  if (error) {
    return (
      <AppShell>
        <p className="feedback error">{error}</p>
      </AppShell>
    );
  }

  if (!listing) {
    return (
      <AppShell>
        <p className="muted">{t("listing.detail.loading")}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="detail-layout">
        <div>
          <div className="hero-image">
            {activeImage ? (
              <img src={activeImage} alt={listing.title} className="listing-image" />
            ) : (
              <div className="placeholder-image">{t("listing.detail.noImage")}</div>
            )}
          </div>

          <div className="thumb-strip">
            {(listing.images?.length ? listing.images : ["no-image"]).map((image) => (
              <button
                key={image}
                type="button"
                className={`thumb ${image === activeImage ? "active" : ""}`}
                onClick={() => setActiveImage(image === "no-image" ? "" : image)}
              >
                {image === "no-image" ? (
                  <span>{t("listing.detail.image")}</span>
                ) : (
                  <img src={image} alt="Preview" className="listing-image" />
                )}
              </button>
            ))}
          </div>
        </div>

        <article className="detail-content">
          <div className="detail-headline">
            <div>
              <span className={`tag status-${String(listing.status || "active").toLowerCase()}`}>
                {localizeStatus(listing.status || "Active", t)}
              </span>
              <h1>{listing.title}</h1>
              <p className="detail-price">{formatVnd(listing.price)}</p>
            </div>
            {listing.sellerInsights?.trustScore ? (
              <div className="trust-score-card">
                <span>{t("listing.detail.trustScore")}</span>
                <strong>{listing.sellerInsights.trustScore}/100</strong>
              </div>
            ) : null}
          </div>

          <TrustBadgeList badges={listing.sellerInsights?.badges || []} />

          <div className="detail-meta-grid">
            <p>
              <strong>{t("listing.meta.condition")}:</strong> {localizeCondition(listing.condition, t)}
            </p>
            <p>
              <strong>{t("listing.meta.courseCode")}:</strong> {listing.courseCode || t("listing.meta.na")}
            </p>
            <p>
              <strong>{t("listing.meta.edition")}:</strong> {listing.edition || t("listing.meta.na")}
            </p>
            <p>
              <strong>{t("listing.meta.isbn")}:</strong> {listing.isbn || t("listing.meta.na")}
            </p>
            <p>
              <strong>{t("listing.meta.meetup")}:</strong>{" "}
              {listing.campusLocation?.name
                ? localizeCampusLocation(listing.campusLocation.name, t)
                : t("listing.meta.flexible")}
            </p>
            <p>
              <strong>{t("listing.meta.safety")}:</strong>{" "}
              {listing.campusLocation?.safetyScore
                ? `${Math.round(listing.campusLocation.safetyScore * 100)}%`
                : t("listing.meta.na")}
            </p>
          </div>

          <p className="detail-description">{listing.description}</p>

          <div className="seller-trust-panel">
            <h3>{t("listing.detail.sellerTrust")}</h3>
            <p>
              <strong>{t("listing.detail.seller")}:</strong> {listing.seller?.name}
            </p>
            <p>
              <strong>{t("listing.detail.rating")}:</strong>{" "}
              {Number(listing.sellerInsights?.averageRating || listing.seller?.rating || 0).toFixed(1)} / 5
            </p>
            <p>
              <strong>{t("listing.detail.completed")}:</strong> {listing.sellerInsights?.completedTransactions || 0}
            </p>
            <p>
              <strong>{t("listing.detail.response")}:</strong>{" "}
              {listing.sellerInsights?.averageResponseMinutes
                ? `${listing.sellerInsights.averageResponseMinutes} mins`
                : t("listing.detail.noData")}
            </p>
            <p>
              <strong>{t("listing.detail.cancellation")}:</strong> {listing.sellerInsights?.cancellationRate || 0}%
            </p>
          </div>

          <div className="action-row">
            {!isOwner ? (
              <>
                <button className="btn btn-secondary" type="button" disabled={saving} onClick={handleToggleSave}>
                  {saved ? t("listing.actions.saved") : t("listing.actions.saveItem")}
                </button>
                <button className="btn btn-primary" type="button" onClick={handleStartChat}>
                  {t("listing.actions.chatSeller")}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={listing.status !== "Active"}
                  onClick={handleReserve}
                >
                  {listing.status === "Reserved"
                    ? t("listing.actions.alreadyReserved")
                    : t("listing.actions.reserve")}
                </button>
                <Link className="btn btn-secondary" to={`/meetup/${listing._id}`}>
                  {t("listing.actions.planMeetup")}
                </Link>
                <button className="btn btn-secondary" type="button" onClick={handleShare}>
                  {t("listing.actions.share")}
                </button>
                {isAuthenticated ? (
                  <button className="btn btn-danger" type="button" onClick={() => setShowReport((prev) => !prev)}>
                    {t("listing.actions.report")}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <Link className="btn btn-secondary" to={`/listing/${listing._id}/edit`}>
                  {t("listing.actions.edit")}
                </Link>
                {listing.status === "Reserved" ? (
                  <button className="btn btn-secondary" type="button" onClick={handleRelease}>
                    {t("listing.actions.release")}
                  </button>
                ) : null}
                <button className="btn btn-secondary" type="button" onClick={handleShare}>
                  {t("listing.actions.share")}
                </button>
              </>
            )}
          </div>

          {showReport ? (
            <form className="report-form panel-card form-stack" onSubmit={submitReport}>
              <h3>{t("listing.detail.reportTitle")}</h3>
              <label>{t("listing.detail.reason")}</label>
              <select
                value={reportForm.reason}
                onChange={(event) => setReportForm((prev) => ({ ...prev, reason: event.target.value }))}
              >
                <option value="Spam or duplicate">{t("listing.detail.report.spam")}</option>
                <option value="Suspicious pricing">{t("listing.detail.report.pricing")}</option>
                <option value="Unsafe meetup behavior">{t("listing.detail.report.safety")}</option>
                <option value="Misleading description">{t("listing.detail.report.misleading")}</option>
                <option value="Other">{t("listing.detail.report.other")}</option>
              </select>

              <label>{t("listing.detail.details")}</label>
              <textarea
                rows={3}
                value={reportForm.details}
                placeholder={t("listing.detail.detailsPlaceholder")}
                onChange={(event) => setReportForm((prev) => ({ ...prev, details: event.target.value }))}
              />
              <div className="action-row">
                <button className="btn btn-danger" type="submit">
                  {t("listing.actions.submitReport")}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowReport(false)}>
                  {t("listing.actions.cancel")}
                </button>
              </div>
            </form>
          ) : null}

          {info ? <p className="feedback success">{info}</p> : null}
        </article>
      </section>

      <RecommendationSection
        title={t("listing.detail.relatedTitle")}
        description={t("listing.detail.relatedDescription")}
        listings={relatedListings}
        emptyMessage={t("listing.detail.relatedEmpty")}
      />
    </AppShell>
  );
}

export default ListingDetailPage;
