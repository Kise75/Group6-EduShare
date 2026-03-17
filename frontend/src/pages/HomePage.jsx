import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ListingCard from "../components/ListingCard";
import RecommendationSection from "../components/RecommendationSection";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";
import { formatVnd } from "../utils/formatCurrency";
import { getRecentItems } from "../utils/itemCollections";

function HomePage() {
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [listings, setListings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHome = async () => {
      setLoading(true);
      setError("");

      try {
        const recent = getRecentItems();
        setRecentItems(recent);

        const [listingResponse, recommendationResponse] = await Promise.all([
          api.get("/listings", { params: { page: 1, limit: 10 } }),
          api.post("/recommendations/home", {
            recentListingIds: recent.map((item) => item._id),
            query: "",
          }),
        ]);

        setListings(listingResponse.data.listings || []);
        setRecommendations(recommendationResponse.data.recommendations || []);
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot load homepage"));
      } finally {
        setLoading(false);
        setRecommendationLoading(false);
      }
    };

    loadHome();
  }, []);

  const handleDelete = async (listing) => {
    const confirmed = window.confirm(`Delete "${listing.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/listings/${listing._id}`);
      setListings((prev) => prev.filter((item) => item._id !== listing._id));
      setRecommendations((prev) => prev.filter((item) => item._id !== listing._id));
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot delete listing"));
    }
  };

  return (
    <AppShell>
      <section className="market-hero">
        <div className="hero-copy">
          <span className="hero-kicker">{t("home.heroKicker")}</span>
          <h1>{t("home.heroTitle")}</h1>
          <p>{t("home.heroDescription")}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/listing/new">
              {t("home.postListing")}
            </Link>
            <Link className="btn btn-secondary" to="/search">
              {t("home.explore")}
            </Link>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric-card">
            <span>{t("home.metric.recommendations")}</span>
            <strong>{recommendations.length}</strong>
            <p className="muted">{t("home.metric.recommendationsText")}</p>
          </div>
          <div className="hero-metric-card">
            <span>{t("home.metric.recentViews")}</span>
            <strong>{recentItems.length}</strong>
            <p className="muted">{t("home.metric.recentViewsText")}</p>
          </div>
          <div className="hero-metric-card">
            <span>{t("home.metric.profile")}</span>
            <strong>{isAuthenticated ? user?.major || t("home.metric.active") : t("home.metric.guest")}</strong>
            <p className="muted">{t("home.metric.profileText")}</p>
          </div>
        </div>
      </section>

      {recentItems.length ? (
        <section className="recent-strip">
          <div className="section-head">
            <div>
              <h2>{t("home.recentTitle")}</h2>
              <p className="muted">{t("home.recentDescription")}</p>
            </div>
          </div>
          <div className="recent-grid">
            {recentItems.map((item) => (
              <Link key={item._id} to={`/listing/${item._id}`} className="recent-card">
                <div className="recent-card-image">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.title} className="listing-image" />
                  ) : (
                    <div className="placeholder-image">{t("listing.detail.image")}</div>
                  )}
                </div>
                <strong>{item.title}</strong>
                <span>{formatVnd(item.price)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recommendationLoading ? <p className="muted">{t("home.recommendationLoading")}</p> : null}

      {!recommendationLoading ? (
        <RecommendationSection
          title={t("home.recommendedTitle")}
          description={t("home.recommendedDescription")}
          listings={recommendations}
          emptyMessage={t("home.recommendedEmpty")}
        />
      ) : null}

      <section className="section-head">
        <div>
          <h1>{t("home.latestTitle")}</h1>
          <p className="muted">{t("home.latestDescription")}</p>
        </div>
        {isAdmin ? (
          <Link className="btn btn-secondary" to="/listing/new">
            {t("home.addProduct")}
          </Link>
        ) : null}
      </section>

      {loading ? <p className="muted">{t("home.loadingListings")}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      {!loading && !error ? (
        <section className="listing-grid">
          {listings.length ? (
            listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                isAdmin={isAdmin}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="empty-block">
              <p>{t("home.emptyTitle")}</p>
              <p className="muted">{t("home.emptyHint")}</p>
            </div>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}

export default HomePage;
