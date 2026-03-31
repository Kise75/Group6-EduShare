import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ListingCard from "../components/ListingCard";
import RecommendationSection from "../components/RecommendationSection";
import { ListingGridSkeleton, SectionSkeleton } from "../components/SkeletonBlocks";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";
import { formatVnd } from "../utils/formatCurrency";
import { getRecentItems } from "../utils/itemCollections";

function HomePage() {
  const { isAdmin, isAuthenticated, user } = useAuth();
  const { language, t } = useI18n();
  const [listings, setListings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState("");
  const heroCopy =
    language === "vi"
      ? {
          journeyLabels: ["Đúng mã môn", "Vừa túi tiền", "Hẹn trong trường"],
          boardEyebrow: "Bảng tin của bạn",
          boardTitle: "Một góc nhỏ để xem nhanh hôm nay có gì đáng chú ý.",
          boardSubtitle: "Bớt kiểu dashboard, gần hơn với cảm giác bảng ghim trong trường.",
          featuredLabel: "Nên xem tiếp",
          featuredLoading: "Đang ghim những tin phù hợp nhất cho bạn...",
          featuredEmpty: "Chưa có gợi ý nổi bật. Xem vài tin đăng hoặc theo dõi mã môn để bảng tin chính xác hơn.",
          featuredCta: "Mở tin",
          featuredMetaFallback: "Tin phù hợp sẽ hiện ở đây khi hệ thống có đủ tín hiệu.",
          recentLabel: "Dấu vết gần đây",
          recentText:
            recentItems.length > 0
              ? "Lịch sử xem đang được dùng để kéo gợi ý gần hơn với những môn bạn thực sự quan tâm."
              : "Khi bạn xem vài tin đăng, mục này sẽ bắt đầu phản ánh gu tìm sách của bạn.",
          profileLabel: "Tài khoản",
          profileFallback: "Đang hoạt động",
          guestValue: "Khách",
          guestText: "Đăng nhập để lưu wishlist, theo dõi mã môn và nhận cảnh báo khi có sách mới đúng môn.",
          memberText:
            user?.trackedCourseCodes?.length > 0
              ? `${user.trackedCourseCodes.length} mã môn đang theo dõi. Cảnh báo sách mới sẽ đổ về wishlist của bạn.`
              : "Tài khoản đã sẵn sàng. Thêm mã môn để nhận cảnh báo đúng nhu cầu học hiện tại.",
          tagTitle: "Bạn đang quan tâm",
          defaultTags: ["Mã môn", "Giá hợp lý", "Điểm hẹn an toàn"],
          viewedCount: `${recentItems.length} mục`,
        }
      : {
          journeyLabels: ["Right course", "Fair price", "Campus meetup"],
          boardEyebrow: "Your board",
          boardTitle: "A quick glance at what matters on campus today.",
          boardSubtitle: "Less dashboard, more like a useful pinboard for student trading.",
          featuredLabel: "Worth opening",
          featuredLoading: "Pinning the most relevant listings for you...",
          featuredEmpty: "No standout recommendation yet. Browse a few listings or follow course codes to sharpen this board.",
          featuredCta: "Open listing",
          featuredMetaFallback: "Relevant listings will appear here when the system has more signals.",
          recentLabel: "Recent trail",
          recentText:
            recentItems.length > 0
              ? "Recent views are already helping the system stay closer to the subjects you actually care about."
              : "Once you browse a few listings, this area will start reflecting your study interests.",
          profileLabel: "Account",
          profileFallback: "Active",
          guestValue: "Guest",
          guestText: "Log in to save a wishlist, follow course codes, and get alerts when matching books appear.",
          memberText:
            user?.trackedCourseCodes?.length > 0
              ? `${user.trackedCourseCodes.length} course codes are being tracked. New-match alerts will show up in your wishlist.`
              : "Your account is ready. Add course codes to receive alerts that fit your current classes.",
          tagTitle: "On your radar",
          defaultTags: ["Course codes", "Fair prices", "Safer meetups"],
          viewedCount: `${recentItems.length} items`,
        };
  const featuredRecommendation = recommendations[0] || null;
  const heroTags = [
    ...new Set(
      [
        ...(user?.trackedCourseCodes || []),
        ...recommendations.map((item) => item.courseCode).filter(Boolean),
        ...recentItems.map((item) => item.courseCode).filter(Boolean),
      ].filter(Boolean)
    ),
  ].slice(0, 4);
  const profileTitle = isAuthenticated ? user?.major || heroCopy.profileFallback : heroCopy.guestValue;

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
          <div className="hero-route-strip">
            {heroCopy.journeyLabels.map((label) => (
              <span key={label} className="hero-route-pill">
                {label}
              </span>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/listing/new">
              {t("home.postListing")}
            </Link>
            <Link className="btn btn-secondary" to="/search">
              {t("home.explore")}
            </Link>
          </div>
        </div>

        <div className="hero-board">
          <div className="hero-board-heading">
            <div>
              <p>{heroCopy.boardEyebrow}</p>
              <strong>{heroCopy.boardTitle}</strong>
            </div>
            <span>{heroCopy.boardSubtitle}</span>
          </div>

          <div className="hero-note-grid">
            <article className="hero-note hero-note-featured">
              <span className="hero-note-label">{heroCopy.featuredLabel}</span>
              {recommendationLoading ? (
                <p>{heroCopy.featuredLoading}</p>
              ) : featuredRecommendation ? (
                <>
                  <strong className="hero-note-title">{featuredRecommendation.title}</strong>
                  <p>{featuredRecommendation.courseCode || featuredRecommendation.category || heroCopy.featuredMetaFallback}</p>
                  <div className="hero-note-meta">
                    {featuredRecommendation.price ? (
                      <span className="hero-note-chip">{formatVnd(featuredRecommendation.price)}</span>
                    ) : null}
                    {featuredRecommendation.condition ? (
                      <span className="hero-note-chip">{featuredRecommendation.condition}</span>
                    ) : null}
                    <Link className="hero-note-link" to={`/listing/${featuredRecommendation._id}`}>
                      {heroCopy.featuredCta}
                    </Link>
                  </div>
                </>
              ) : (
                <p>{heroCopy.featuredEmpty}</p>
              )}
            </article>

            <article className="hero-note hero-note-sand">
              <span className="hero-note-label">{heroCopy.recentLabel}</span>
              <strong className="hero-note-value">{loading ? "--" : heroCopy.viewedCount}</strong>
              <p>{heroCopy.recentText}</p>
            </article>

            <article className="hero-note hero-note-mint">
              <div>
                <span className="hero-note-label">{heroCopy.profileLabel}</span>
                <strong className="hero-note-title">{loading ? "..." : profileTitle}</strong>
                <p>{isAuthenticated ? heroCopy.memberText : heroCopy.guestText}</p>
              </div>
              <div className="hero-note-tag-block">
                <span className="hero-tag-caption">{heroCopy.tagTitle}</span>
                <div className="hero-note-tag-row">
                  {(heroTags.length ? heroTags : heroCopy.defaultTags).map((tag) => (
                    <span key={tag} className="hero-note-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
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

      {recommendationLoading ? <SectionSkeleton count={4} titleWidth="wide" /> : null}

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

      {error ? <p className="feedback error">{error}</p> : null}

      {loading && !error ? <ListingGridSkeleton count={6} /> : null}

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
