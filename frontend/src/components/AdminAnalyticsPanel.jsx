import { useMemo } from "react";

const ACTIVITY_SERIES = [
  { key: "users", label: "Tài khoản mới", color: "#1d71e8" },
  { key: "listings", label: "Tin đăng mới", color: "#22c55e" },
  { key: "reports", label: "Báo cáo mới", color: "#f97316" },
  { key: "reviews", label: "Đánh giá mới", color: "#8b5cf6" },
];

const REPORT_STATUS_COLORS = {
  Open: "#f97316",
  Reviewed: "#1d71e8",
  Resolved: "#22c55e",
  Dismissed: "#94a3b8",
};

const INVENTORY_COLORS = {
  Active: "#22c55e",
  Reserved: "#f59e0b",
  Sold: "#1d71e8",
  Hidden: "#d63737",
};

const CATEGORY_COLORS = ["#1d71e8", "#22c55e", "#f97316", "#8b5cf6", "#0f766e", "#dc2626"];

const getDayKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildRecentDays = (windowSize = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: windowSize }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (windowSize - 1 - index));

    return {
      key: getDayKey(date),
      label: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date),
    };
  });
};

const bucketByDays = (items, dateField, days) => {
  const totals = Object.fromEntries(days.map((day) => [day.key, 0]));

  items.forEach((item) => {
    const key = getDayKey(item?.[dateField]);
    if (key && totals[key] !== undefined) {
      totals[key] += 1;
    }
  });

  return days.map((day) => ({
    label: day.label,
    key: day.key,
    value: totals[day.key] || 0,
  }));
};

const groupAndSort = (items, getLabel) =>
  Object.entries(
    items.reduce((accumulator, item) => {
      const label = getLabel(item);
      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);

const formatPercent = (value, total) => {
  if (!total) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
};

function ReportDonutChart({ segments, total }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="admin-donut-layout">
      <div className="admin-donut-frame" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="admin-donut-chart">
          <circle className="admin-donut-track" cx="60" cy="60" r={radius} />
          <g transform="rotate(-90 60 60)">
            {segments.map((segment) => {
              const length = total ? (segment.value / total) * circumference : 0;
              const strokeDasharray = `${length} ${Math.max(circumference - length, 0)}`;
              const circle = (
                <circle
                  key={segment.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeLinecap={length > 0 ? "round" : "butt"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-offset}
                />
              );

              offset += length;
              return circle;
            })}
          </g>
        </svg>
        <div className="admin-donut-center">
          <strong>{total}</strong>
          <span>Báo cáo</span>
        </div>
      </div>

      <div className="admin-donut-legend">
        {segments.map((segment) => (
          <div className="admin-donut-legend-row" key={segment.label}>
            <div className="admin-donut-legend-label">
              <span className="admin-color-dot" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <strong>
              {segment.value} · {formatPercent(segment.value, total)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityBars({ days, series }) {
  const maxValue = Math.max(1, ...series.flatMap((item) => item.values.map((entry) => entry.value)));

  return (
    <div className="admin-activity-card">
      <div className="admin-chart-legend">
        {series.map((item) => (
          <span key={item.key} className="admin-chart-legend-item">
            <span className="admin-color-dot" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="admin-activity-chart" role="img" aria-label="Biểu đồ hoạt động 7 ngày gần đây">
        {days.map((day, index) => (
          <div className="admin-activity-day" key={day.key}>
            <div className="admin-activity-bars">
              {series.map((item) => {
                const value = item.values[index]?.value || 0;
                const height = value ? Math.max(14, (value / maxValue) * 132) : 8;

                return (
                  <div
                    key={`${item.key}-${day.key}`}
                    className="admin-activity-bar"
                    style={{ height: `${height}px`, backgroundColor: item.color, opacity: value ? 1 : 0.2 }}
                    title={`${item.label}: ${value}`}
                  />
                );
              })}
            </div>
            <span>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryMix({ segments, categories }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const maxCategoryValue = Math.max(1, ...categories.map((item) => item.value));

  return (
    <div className="admin-inventory-panel">
      <div className="admin-stack-bar" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="admin-stack-segment"
            style={{
              width: `${total ? (segment.value / total) * 100 : 0}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>

      <div className="admin-stack-legend">
        {segments.map((segment) => (
          <div className="admin-stack-legend-row" key={segment.label}>
            <div className="admin-donut-legend-label">
              <span className="admin-color-dot" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <strong>{segment.value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-horizontal-bars">
        {categories.map((item) => (
          <div className="admin-horizontal-bar-row" key={item.label}>
            <div className="admin-horizontal-bar-head">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="admin-horizontal-track">
              <span
                className="admin-horizontal-fill"
                style={{
                  width: `${(item.value / maxCategoryValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalyticsPanel({ overview, localizeCategory, localizeReportReason }) {
  const analytics = useMemo(() => {
    const users = overview?.users || [];
    const listings = overview?.listings || [];
    const reports = overview?.reports || [];
    const reviews = overview?.reviews || [];
    const days = buildRecentDays(7);

    const activitySeries = ACTIVITY_SERIES.map((series) => ({
      ...series,
      values: bucketByDays(
        series.key === "users"
          ? users
          : series.key === "listings"
            ? listings
            : series.key === "reports"
              ? reports
              : reviews,
        "createdAt",
        days
      ),
    }));

    const peakDay = days.reduce(
      (best, day, index) => {
        const total = activitySeries.reduce((sum, series) => sum + (series.values[index]?.value || 0), 0);

        if (total > best.total) {
          return { label: day.label, total };
        }

        return best;
      },
      { label: days[0]?.label || "", total: 0 }
    );

    const reportStatusSegments = [
      { label: "Đang mở", value: reports.filter((report) => report.status === "Open").length, color: REPORT_STATUS_COLORS.Open },
      {
        label: "Đã xem xét",
        value: reports.filter((report) => report.status === "Reviewed").length,
        color: REPORT_STATUS_COLORS.Reviewed,
      },
      {
        label: "Đã xử lý",
        value: reports.filter((report) => report.status === "Resolved").length,
        color: REPORT_STATUS_COLORS.Resolved,
      },
      {
        label: "Đã bỏ qua",
        value: reports.filter((report) => report.status === "Dismissed").length,
        color: REPORT_STATUS_COLORS.Dismissed,
      },
    ];

    const topReportReasons = groupAndSort(reports, (report) => localizeReportReason(report.reason))
      .slice(0, 4)
      .map((item, index) => ({
        ...item,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));

    const inventorySegments = [
      { label: "Còn hàng", value: listings.filter((listing) => listing.status === "Active").length, color: INVENTORY_COLORS.Active },
      {
        label: "Đã đặt trước",
        value: listings.filter((listing) => listing.status === "Reserved").length,
        color: INVENTORY_COLORS.Reserved,
      },
      { label: "Đã bán", value: listings.filter((listing) => listing.status === "Sold").length, color: INVENTORY_COLORS.Sold },
      {
        label: "Đã ẩn",
        value: listings.filter((listing) => listing.visibility === "Hidden").length,
        color: INVENTORY_COLORS.Hidden,
      },
    ];

    const categoryBreakdown = groupAndSort(listings, (listing) => localizeCategory(listing.category || "Others"))
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));

    return {
      days,
      activitySeries,
      peakDay,
      reportStatusSegments,
      topReportReasons,
      inventorySegments,
      categoryBreakdown,
    };
  }, [localizeCategory, localizeReportReason, overview]);

  return (
    <section className="admin-analytics-grid">
      <article className="panel-card admin-analytics-card admin-analytics-card-wide">
        <div className="admin-analytics-head">
          <div>
            <h2>Nhịp hoạt động 7 ngày</h2>
            <p className="muted">
              Theo dõi tài khoản mới, tin đăng mới, báo cáo và đánh giá để nhận ra lúc hệ thống tăng tải.
            </p>
          </div>
          <span className="admin-analytics-badge">
            Cao điểm gần nhất: {analytics.peakDay.label} · {analytics.peakDay.total} tín hiệu
          </span>
        </div>

        <ActivityBars days={analytics.days} series={analytics.activitySeries} />
      </article>

      <article className="panel-card admin-analytics-card">
        <div className="admin-analytics-head">
          <div>
            <h2>Hàng đợi báo cáo</h2>
            <p className="muted">Nhìn nhanh tỷ lệ báo cáo còn mở, đã xem xét và đã đóng để cân đối nhân lực kiểm duyệt.</p>
          </div>
        </div>

        <ReportDonutChart
          segments={analytics.reportStatusSegments}
          total={(overview?.reports || []).length}
        />

        <div className="admin-subchart">
          <h3>Lý do bị báo nhiều nhất</h3>
          <div className="admin-horizontal-bars compact">
            {analytics.topReportReasons.length ? (
              analytics.topReportReasons.map((item) => (
                <div className="admin-horizontal-bar-row" key={item.label}>
                  <div className="admin-horizontal-bar-head">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="admin-horizontal-track">
                    <span
                      className="admin-horizontal-fill"
                      style={{
                        width: `${(item.value / Math.max(...analytics.topReportReasons.map((reason) => reason.value), 1)) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Chưa có báo cáo nào để phân tích.</p>
            )}
          </div>
        </div>
      </article>

      <article className="panel-card admin-analytics-card">
        <div className="admin-analytics-head">
          <div>
            <h2>Phân bổ kho tin</h2>
            <p className="muted">Xem nhanh tin đang còn hàng, đã đặt, đã bán, đã ẩn và nhóm danh mục nào xuất hiện nhiều nhất.</p>
          </div>
        </div>

        <InventoryMix
          segments={analytics.inventorySegments}
          categories={analytics.categoryBreakdown}
        />
      </article>
    </section>
  );
}

export default AdminAnalyticsPanel;
