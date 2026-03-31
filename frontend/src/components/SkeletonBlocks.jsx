function ListingSkeletonCard() {
  return (
    <article className="listing-card skeleton-card" aria-hidden="true">
      <div className="listing-image-wrap skeleton-block" />
      <div className="listing-card-topline">
        <span className="skeleton-pill skeleton-block" />
        <span className="skeleton-pill skeleton-block" />
      </div>
      <div className="skeleton-line skeleton-line-lg skeleton-block" />
      <div className="skeleton-line skeleton-block" />
      <div className="skeleton-line skeleton-block" />
      <div className="skeleton-line skeleton-line-md skeleton-block" />
      <div className="card-actions">
        <div className="skeleton-button skeleton-block" />
        <div className="skeleton-button skeleton-block" />
      </div>
    </article>
  );
}

export function ListingGridSkeleton({ count = 4 }) {
  return (
    <section className="listing-grid" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <ListingSkeletonCard key={`listing-skeleton-${index}`} />
      ))}
    </section>
  );
}

export function SectionSkeleton({ count = 4, titleWidth = "medium" }) {
  return (
    <section className="recommendation-section" aria-label="Loading section">
      <div className="section-head skeleton-section-head">
        <div>
          <div
            className={`skeleton-line skeleton-block ${
              titleWidth === "wide" ? "skeleton-line-xl" : "skeleton-line-lg"
            }`}
          />
          <div className="skeleton-line skeleton-line-md skeleton-block" />
        </div>
      </div>
      <ListingGridSkeleton count={count} />
    </section>
  );
}

export function MetricSkeletonRow({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`metric-skeleton-${index}`} className="hero-metric-card skeleton-card">
          <div className="skeleton-line skeleton-line-sm skeleton-block" />
          <div className="skeleton-line skeleton-line-md skeleton-block" />
          <div className="skeleton-line skeleton-block" />
          <div className="skeleton-line skeleton-line-sm skeleton-block" />
        </div>
      ))}
    </>
  );
}
