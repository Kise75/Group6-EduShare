import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import AdminAnalyticsPanel from "../components/AdminAnalyticsPanel";
import api, { parseApiError } from "../services/api";

const matchesKeyword = (value, keyword) =>
  !keyword || String(value || "").toLowerCase().includes(keyword);

const ROLE_LABELS = {
  admin: "Quản trị viên",
  user: "Người dùng",
};

const ACCOUNT_STATUS_LABELS = {
  Active: "Hoạt động",
  Banned: "Đã khóa",
};

const LISTING_STATUS_LABELS = {
  Active: "Còn hàng",
  Reserved: "Đã đặt trước",
  Sold: "Đã bán",
};

const VISIBILITY_LABELS = {
  Visible: "Đang hiển thị",
  Hidden: "Đã ẩn",
};

const REPORT_STATUS_LABELS = {
  Open: "Đang mở",
  Reviewed: "Đã xem xét",
  Resolved: "Đã xử lý",
  Dismissed: "Đã bỏ qua",
};

const REVIEW_STATUS_LABELS = {
  Published: "Đang hiển thị",
  Hidden: "Đã ẩn",
};

const REPORT_ACTION_LABELS = {
  none: "Chưa áp dụng",
  warning: "Nhắc nhở",
  "listing-hidden": "Ẩn tin đăng",
  "user-banned": "Khóa tài khoản",
  dismissed: "Bỏ qua",
};

const CATEGORY_LABELS = {
  Textbooks: "Giáo trình",
  "Lab Kits": "Bộ dụng cụ thí nghiệm",
  Notes: "Tài liệu",
  Others: "Khác",
};

const REPORT_REASON_LABELS = {
  "Spam or duplicate": "Spam hoặc trùng lặp",
  "Suspicious pricing": "Giá đáng ngờ",
  "Unsafe meetup behavior": "Hành vi gặp mặt không an toàn",
  "Misleading description": "Mô tả gây hiểu nhầm",
  Other: "Khác",
};

const localizeRole = (value) => ROLE_LABELS[value] || value || "Người dùng";

const localizeAccountStatus = (value) => ACCOUNT_STATUS_LABELS[value] || value || "Hoạt động";

const localizeListingStatus = (value) => LISTING_STATUS_LABELS[value] || value || "Còn hàng";

const localizeVisibility = (value) => VISIBILITY_LABELS[value] || value || "Đang hiển thị";

const localizeReportStatus = (value) => REPORT_STATUS_LABELS[value] || value || "Đang mở";

const localizeReviewStatus = (value) => REVIEW_STATUS_LABELS[value] || value || "Đang hiển thị";

const localizeReportAction = (value) =>
  REPORT_ACTION_LABELS[value] || value || REPORT_ACTION_LABELS.none;

const localizeCategory = (value) => CATEGORY_LABELS[value] || value || "Khác";

const localizeReportReason = (value) => REPORT_REASON_LABELS[value] || value || "Không rõ";

const localizeTargetType = (value) => {
  if (value === "listing") {
    return "Tin đăng";
  }

  if (value === "user") {
    return "Người dùng";
  }

  return value || "Không rõ";
};

const translateAdminApiMessage = (message, fallback = "") => {
  const text = String(message || "").trim();

  if (!text) {
    return fallback;
  }

  const directMap = {
    "Cannot load admin overview": "Không thể tải tổng quan quản trị.",
    "Cannot update role": "Không thể cập nhật vai trò.",
    "Cannot restore user": "Không thể khôi phục tài khoản.",
    "Cannot ban user": "Không thể khóa tài khoản.",
    "Cannot unhide listing": "Không thể hiển thị lại tin đăng.",
    "Cannot hide listing": "Không thể ẩn tin đăng.",
    "Cannot delete listing": "Không thể xóa tin đăng.",
    "Cannot update report": "Không thể cập nhật báo cáo.",
    "Cannot resolve report": "Không thể xử lý báo cáo.",
    "Cannot dismiss report": "Không thể bỏ qua báo cáo.",
    "Cannot moderate review": "Không thể kiểm duyệt đánh giá.",
    "User not found": "Không tìm thấy người dùng.",
    "Listing not found": "Không tìm thấy tin đăng.",
    "Report not found": "Không tìm thấy báo cáo.",
    "Review not found": "Không tìm thấy đánh giá.",
    "Role must be either user or admin": "Vai trò phải là người dùng hoặc quản trị viên.",
    "You cannot change your own role": "Bạn không thể tự thay đổi vai trò của mình.",
    "You cannot ban your own account": "Bạn không thể tự khóa tài khoản của mình.",
    "Invalid report status": "Trạng thái báo cáo không hợp lệ.",
    "Invalid report action": "Hành động xử lý báo cáo không hợp lệ.",
    "Moderation actions can only be applied when resolving a report":
      "Chỉ có thể áp dụng hành động kiểm duyệt khi xử lý báo cáo.",
    "This report has no listing to hide": "Báo cáo này không có tin đăng để ẩn.",
    "This report has no user to ban": "Báo cáo này không có người dùng để khóa.",
    "You cannot ban your own account through reports":
      "Bạn không thể tự khóa tài khoản của mình thông qua báo cáo.",
    "Review status must be Published or Hidden": "Trạng thái đánh giá phải là hiển thị hoặc ẩn.",
    "Not authorized to delete this listing": "Bạn không có quyền xóa tin đăng này.",
    "Listing deleted successfully": "Đã xóa tin đăng thành công.",
    "Report workflow updated successfully": "Đã cập nhật quy trình xử lý báo cáo.",
    "Network Error": "Lỗi kết nối mạng.",
    "Something went wrong": "Đã xảy ra lỗi.",
  };

  if (directMap[text]) {
    return directMap[text];
  }

  const roleMatch = text.match(/^Role updated to (user|admin)$/);
  if (roleMatch) {
    return `Đã cập nhật vai trò thành ${localizeRole(roleMatch[1]).toLowerCase()}.`;
  }

  const banMatch = text.match(/^(.*) has been banned and their listings were hidden$/);
  if (banMatch) {
    return `Đã khóa tài khoản ${banMatch[1]} và ẩn các tin đăng liên quan.`;
  }

  const restoreMatch = text.match(/^(.*) has been restored$/);
  if (restoreMatch) {
    return `Đã khôi phục tài khoản ${restoreMatch[1]}.`;
  }

  const hideListingMatch = text.match(/^"(.+)" is now hidden from the marketplace$/);
  if (hideListingMatch) {
    return `Đã ẩn tin "${hideListingMatch[1]}" khỏi sàn giao dịch.`;
  }

  const unhideListingMatch = text.match(/^"(.+)" is visible again$/);
  if (unhideListingMatch) {
    return `Đã hiển thị lại tin "${unhideListingMatch[1]}".`;
  }

  if (text === "Review hidden successfully") {
    return "Đã ẩn đánh giá thành công.";
  }

  if (text === "Review restored successfully") {
    return "Đã khôi phục đánh giá thành công.";
  }

  return fallback || text;
};

function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [listingFilter, setListingFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");

  const loadOverview = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await api.get("/admin/overview");
      setOverview(response.data);
      setError("");
    } catch (requestError) {
      setError(
        translateAdminApiMessage(
          parseApiError(requestError, "Cannot load admin overview"),
          "Không thể tải tổng quan quản trị."
        )
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const runAdminAction = async (key, action, successMessage, errorMessage) => {
    setBusyKey(key);
    setError("");
    setInfo("");

    try {
      await action();
      setInfo(successMessage);
      await loadOverview(false);
    } catch (requestError) {
      setError(
        translateAdminApiMessage(parseApiError(requestError, errorMessage), errorMessage)
      );
    } finally {
      setBusyKey("");
    }
  };

  const updateRole = async (userId, role) =>
    runAdminAction(
      `role-${userId}-${role}`,
      () => api.put(`/admin/users/${userId}/role`, { role }),
      `Đã cập nhật vai trò thành ${localizeRole(role).toLowerCase()}.`,
      "Không thể cập nhật vai trò."
    );

  const toggleUserBan = async (user) => {
    if (user.status === "Banned") {
      const confirmed = window.confirm(
        `Khôi phục tài khoản của ${user.name}? Các tin đã ẩn sẽ vẫn giữ nguyên cho đến khi được xem lại.`
      );
      if (!confirmed) {
        return;
      }

      await runAdminAction(
        `unban-${user.id}`,
        () => api.put(`/admin/users/${user.id}/unban`),
        `Đã khôi phục tài khoản ${user.name}.`,
        "Không thể khôi phục tài khoản."
      );
      return;
    }

    const reason = window.prompt(
      `Lý do khóa tài khoản của ${user.name}:`,
      user.banReason || "Vi phạm chính sách nhiều lần"
    );

    if (reason === null) {
      return;
    }

    await runAdminAction(
      `ban-${user.id}`,
      () => api.put(`/admin/users/${user.id}/ban`, { reason }),
      `Đã khóa tài khoản ${user.name}.`,
      "Không thể khóa tài khoản."
    );
  };

  const toggleListingVisibility = async (listing) => {
    if (listing.visibility === "Hidden") {
      const confirmed = window.confirm(`Hiển thị lại "${listing.title}" trên sàn giao dịch?`);
      if (!confirmed) {
        return;
      }

      await runAdminAction(
        `unhide-${listing._id}`,
        () => api.put(`/admin/listings/${listing._id}/unhide`),
        `Đã hiển thị lại tin "${listing.title}".`,
        "Không thể hiển thị lại tin đăng."
      );
      return;
    }

    const reason = window.prompt(
      `Lý do ẩn "${listing.title}":`,
      listing.hiddenReason || "Đang được kiểm duyệt"
    );

    if (reason === null) {
      return;
    }

    await runAdminAction(
      `hide-${listing._id}`,
      () => api.put(`/admin/listings/${listing._id}/hide`, { reason }),
      `Đã ẩn tin "${listing.title}".`,
      "Không thể ẩn tin đăng."
    );
  };

  const deleteListing = async (listing) => {
    const confirmed = window.confirm(
      `Xóa vĩnh viễn "${listing.title}"? Hành động này không thể hoàn tác.`
    );
    if (!confirmed) {
      return;
    }

    await runAdminAction(
      `delete-${listing._id}`,
      () => api.delete(`/listings/${listing._id}`),
      `Đã xóa tin "${listing.title}".`,
      "Không thể xóa tin đăng."
    );
  };

  const updateReport = async (report, payload, successMessage, errorMessage) =>
    runAdminAction(
      `report-${report._id}-${payload.status}-${payload.actionTaken || "none"}`,
      () => api.put(`/admin/reports/${report._id}`, payload),
      successMessage,
      errorMessage
    );

  const markReviewed = async (report) => {
    const note = window.prompt("Ghi chú của quản trị viên (không bắt buộc):", report.resolutionNote || "");
    if (note === null) {
      return;
    }

    await updateReport(
      report,
      {
        status: "Reviewed",
        actionTaken: "warning",
        resolutionNote: note,
      },
      "Đã chuyển báo cáo sang trạng thái đã xem xét.",
      "Không thể cập nhật báo cáo."
    );
  };

  const resolveReport = async (report, actionTaken = "none") => {
    const defaultNote =
      actionTaken === "listing-hidden"
        ? "Đã ẩn tin đăng sau khi xem xét."
        : actionTaken === "user-banned"
          ? "Đã khóa tài khoản sau khi xem xét an toàn."
          : report.resolutionNote || "";
    const note = window.prompt("Ghi chú xử lý:", defaultNote);

    if (note === null) {
      return;
    }

    await updateReport(
      report,
      {
        status: "Resolved",
        actionTaken,
        resolutionNote: note,
      },
      actionTaken === "listing-hidden"
        ? "Đã xử lý báo cáo và ẩn tin đăng."
        : actionTaken === "user-banned"
          ? "Đã xử lý báo cáo và khóa tài khoản."
          : "Đã xử lý báo cáo.",
      "Không thể xử lý báo cáo."
    );
  };

  const dismissReport = async (report) => {
    const note = window.prompt(
      "Lý do bỏ qua:",
      report.resolutionNote || "Không cần thực hiện thêm hành động"
    );
    if (note === null) {
      return;
    }

    await updateReport(
      report,
      {
        status: "Dismissed",
        actionTaken: "dismissed",
        resolutionNote: note,
      },
      "Đã bỏ qua báo cáo.",
      "Không thể bỏ qua báo cáo."
    );
  };

  const moderateReview = async (review, status) => {
    const defaultNote =
      status === "Hidden"
        ? review.moderationNote || "Đã ẩn đánh giá để chờ kiểm duyệt."
        : review.moderationNote || "Đã khôi phục đánh giá sau kiểm duyệt.";
    const note = window.prompt("Ghi chú kiểm duyệt:", defaultNote);

    if (note === null) {
      return;
    }

    await runAdminAction(
      `review-${review._id}-${status}`,
      () =>
        api.put(`/admin/reviews/${review._id}/moderation`, {
          status,
          moderationNote: note,
        }),
      status === "Hidden" ? "Đã ẩn đánh giá." : "Đã khôi phục đánh giá.",
      "Không thể kiểm duyệt đánh giá."
    );
  };

  const filteredUsers = useMemo(() => {
    const keyword = userQuery.trim().toLowerCase();

    return (overview?.users || []).filter((user) => {
      const matchesText =
        matchesKeyword(user.name, keyword) ||
        matchesKeyword(user.email, keyword) ||
        matchesKeyword(user.major, keyword) ||
        matchesKeyword(user.username, keyword);

      if (!matchesText) {
        return false;
      }

      if (userFilter === "banned") {
        return user.status === "Banned";
      }

      if (userFilter === "admin") {
        return user.role === "admin";
      }

      return true;
    });
  }, [overview?.users, userFilter, userQuery]);

  const filteredListings = useMemo(() => {
    return (overview?.listings || []).filter((listing) => {
      if (listingFilter === "hidden") {
        return listing.visibility === "Hidden";
      }

      if (listingFilter === "reported") {
        return Number(listing.reportCount || 0) > 0;
      }

      if (listingFilter === "reserved") {
        return listing.status === "Reserved";
      }

      return true;
    });
  }, [listingFilter, overview?.listings]);

  const filteredReports = useMemo(() => {
    return (overview?.reports || []).filter((report) => {
      if (reportFilter === "open") {
        return report.status === "Open";
      }

      if (reportFilter === "reviewed") {
        return report.status === "Reviewed";
      }

      if (reportFilter === "resolved") {
        return report.status === "Resolved" || report.status === "Dismissed";
      }

      return true;
    });
  }, [overview?.reports, reportFilter]);

  const filteredReviews = useMemo(() => {
    return (overview?.reviews || []).filter((review) => {
      if (reviewFilter === "hidden") {
        return review.status === "Hidden";
      }

      if (reviewFilter === "published") {
        return review.status !== "Hidden";
      }

      return true;
    });
  }, [overview?.reviews, reviewFilter]);

  const statCards = [
    {
      label: "Người dùng",
      value: overview?.stats?.totalUsers || 0,
      hint: `${overview?.stats?.bannedUsers || 0} bị khóa`,
    },
    {
      label: "Tin đăng",
      value: overview?.stats?.totalListings || 0,
      hint: `${overview?.stats?.hiddenListings || 0} bị ẩn`,
    },
    {
      label: "Báo cáo",
      value: overview?.stats?.totalReports || 0,
      hint: `${overview?.stats?.openReports || 0} đang mở`,
    },
    {
      label: "Đánh giá",
      value: overview?.stats?.totalReviews || 0,
      hint: `${overview?.stats?.hiddenReviews || 0} bị ẩn`,
    },
    {
      label: "Lịch hẹn",
      value: overview?.stats?.totalMeetups || 0,
      hint: `${overview?.stats?.pendingMeetups || 0} đang chờ`,
    },
    {
      label: "Đã giữ chỗ",
      value: overview?.stats?.reservedListings || 0,
      hint: "Tin đăng đang chờ gặp mặt",
    },
  ];

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>Trung tâm kiểm duyệt quản trị</h1>
          <p className="muted">
            Theo dõi sức khỏe hệ thống, xử lý nội dung rủi ro và giữ cho EduShare an toàn hơn
            trong các giao dịch của sinh viên.
          </p>
        </div>
      </section>

      {error ? <p className="feedback error">{error}</p> : null}
      {info ? <p className="feedback success">{info}</p> : null}

      {loading && !overview ? (
        <section className="panel-card admin-loading-card">
          <h2>Đang tải bảng điều khiển kiểm duyệt...</h2>
          <p className="muted">
            Đang lấy dữ liệu người dùng, tin đăng, báo cáo, đánh giá và tín hiệu giao dịch.
          </p>
        </section>
      ) : null}

      {overview ? (
        <>
          <section className="admin-summary-grid">
            {statCards.map((card) => (
              <article className="stat-card admin-stat-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p className="muted">{card.hint}</p>
              </article>
            ))}
          </section>

          <AdminAnalyticsPanel
            overview={overview}
            localizeCategory={localizeCategory}
            localizeReportReason={localizeReportReason}
          />

          <section className="admin-layout admin-layout-expanded">
            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Quản lý người dùng</h2>
                  <p className="muted">
                    Nâng quyền quản trị, khóa tài khoản rủi ro và rà soát tình trạng tài khoản.
                  </p>
                </div>
                <div className="admin-toolbar">
                  <input
                    value={userQuery}
                    placeholder="Tìm theo tên, email, ngành học..."
                    onChange={(event) => setUserQuery(event.target.value)}
                  />
                  <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                    <option value="all">Tất cả người dùng</option>
                    <option value="admin">Chỉ quản trị viên</option>
                    <option value="banned">Chỉ tài khoản bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="admin-list">
                {filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <div className="admin-row admin-row-rich" key={user.id}>
                      <div className="admin-row-main">
                        <div className="admin-row-topline">
                          <strong>{user.name}</strong>
                          <div className="admin-chip-row">
                            <span className={`tag role-${user.role}`}>{localizeRole(user.role)}</span>
                            <span className={`tag status-${String(user.status || "Active").toLowerCase()}`}>
                              {localizeAccountStatus(user.status || "Active")}
                            </span>
                          </div>
                        </div>
                        <p className="muted">
                          {user.email}
                          {user.username ? ` | @${user.username}` : ""}
                          {user.major ? ` | ${user.major}` : ""}
                        </p>
                        {user.banReason ? (
                          <p className="admin-note error-note">Lý do khóa: {user.banReason}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions">
                        {user.role === "user" ? (
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={busyKey === `role-${user.id}-admin`}
                            onClick={() => updateRole(user.id, "admin")}
                          >
                            Chuyển thành quản trị viên
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={busyKey === `role-${user.id}-user`}
                            onClick={() => updateRole(user.id, "user")}
                          >
                            Chuyển thành người dùng
                          </button>
                        )}

                        <button
                          className={user.status === "Banned" ? "btn btn-secondary" : "btn btn-danger"}
                          type="button"
                          disabled={busyKey === `ban-${user.id}` || busyKey === `unban-${user.id}`}
                          onClick={() => toggleUserBan(user)}
                        >
                          {user.status === "Banned" ? "Mở khóa" : "Khóa tài khoản"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>Không có người dùng nào khớp với bộ lọc hiện tại.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Kiểm duyệt tin đăng</h2>
                  <p className="muted">
                    Ẩn nội dung rủi ro, kiểm tra trạng thái giữ chỗ hoặc xóa nội dung không hợp lệ.
                  </p>
                </div>
                <div className="admin-toolbar">
                  <select value={listingFilter} onChange={(event) => setListingFilter(event.target.value)}>
                    <option value="all">Tất cả tin đăng</option>
                    <option value="hidden">Tin đã ẩn</option>
                    <option value="reported">Tin bị báo cáo</option>
                    <option value="reserved">Tin đã đặt trước</option>
                  </select>
                </div>
              </div>

              <div className="admin-list">
                {filteredListings.length ? (
                  filteredListings.map((listing) => (
                    <div className="admin-row admin-row-rich" key={listing._id}>
                      <div className="admin-row-main">
                        <div className="admin-row-topline">
                          <strong>{listing.title}</strong>
                          <div className="admin-chip-row">
                            <span className={`tag status-${String(listing.status || "active").toLowerCase()}`}>
                              {localizeListingStatus(listing.status)}
                            </span>
                            <span
                              className={`tag visibility-${String(listing.visibility || "Visible").toLowerCase()}`}
                            >
                              {localizeVisibility(listing.visibility || "Visible")}
                            </span>
                          </div>
                        </div>
                        <p className="muted">
                          Người bán: {listing.seller?.name || "Không rõ"} |{" "}
                          {localizeCategory(listing.category)} |{" "}
                          {listing.courseCode || "Chưa có mã môn"} | Báo cáo: {listing.reportCount || 0}
                        </p>
                        {listing.hiddenReason ? (
                          <p className="admin-note warning-note">Lý do ẩn: {listing.hiddenReason}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions">
                        <button
                          className={listing.visibility === "Hidden" ? "btn btn-secondary" : "btn btn-danger"}
                          type="button"
                          disabled={busyKey === `hide-${listing._id}` || busyKey === `unhide-${listing._id}`}
                          onClick={() => toggleListingVisibility(listing)}
                        >
                          {listing.visibility === "Hidden" ? "Hiển thị lại" : "Ẩn tin"}
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          disabled={busyKey === `delete-${listing._id}`}
                          onClick={() => deleteListing(listing)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>Không có tin đăng nào khớp với bộ lọc kiểm duyệt hiện tại.</p>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-layout admin-layout-expanded">
            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Hàng đợi xử lý báo cáo</h2>
                  <p className="muted">
                    Theo dõi các vụ việc, xử lý rõ ràng và lưu lại hành động kiểm duyệt.
                  </p>
                </div>
                <div className="admin-toolbar">
                  <select value={reportFilter} onChange={(event) => setReportFilter(event.target.value)}>
                    <option value="all">Tất cả báo cáo</option>
                    <option value="open">Đang mở</option>
                    <option value="reviewed">Đã xem xét</option>
                    <option value="resolved">Đã xử lý / Đã bỏ qua</option>
                  </select>
                </div>
              </div>

              <div className="admin-list">
                {filteredReports.length ? (
                  filteredReports.map((report) => (
                    <div className="admin-row admin-row-rich" key={report._id}>
                      <div className="admin-row-main">
                        <div className="admin-row-topline">
                          <strong>{localizeReportReason(report.reason)}</strong>
                          <div className="admin-chip-row">
                            <span className={`tag status-${String(report.status || "open").toLowerCase()}`}>
                              {localizeReportStatus(report.status)}
                            </span>
                            <span className="tag action-tag">
                              {localizeReportAction(report.actionTaken || "none")}
                            </span>
                          </div>
                        </div>
                        <p className="muted">
                          Người báo cáo: {report.reporter?.name || "Không rõ"} | Đối tượng:{" "}
                          {report.targetListing?.title ||
                            report.targetUser?.name ||
                            localizeTargetType(report.targetType)}
                        </p>
                        {report.details ? <p>{report.details}</p> : null}
                        {report.resolutionNote ? (
                          <p className="admin-note">Ghi chú xử lý: {report.resolutionNote}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions stacked">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => markReviewed(report)}
                        >
                          Đánh dấu đã xem xét
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => resolveReport(report)}
                        >
                          Xử lý báo cáo
                        </button>
                        {report.targetListing ? (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey.startsWith(`report-${report._id}`)}
                            onClick={() => resolveReport(report, "listing-hidden")}
                          >
                            Xử lý và ẩn tin
                          </button>
                        ) : null}
                        {report.targetUser ? (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey.startsWith(`report-${report._id}`)}
                            onClick={() => resolveReport(report, "user-banned")}
                          >
                            Xử lý và khóa tài khoản
                          </button>
                        ) : null}
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => dismissReport(report)}
                        >
                          Bỏ qua
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>Không có báo cáo nào trong hàng đợi này.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Kiểm duyệt đánh giá</h2>
                  <p className="muted">
                    Ẩn đánh giá vi phạm, khôi phục đánh giá hợp lệ và giữ độ tin cậy cho hệ thống chấm điểm.
                  </p>
                </div>
                <div className="admin-toolbar">
                  <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
                    <option value="all">Tất cả đánh giá</option>
                    <option value="published">Đang hiển thị</option>
                    <option value="hidden">Đã ẩn</option>
                  </select>
                </div>
              </div>

              <div className="admin-list">
                {filteredReviews.length ? (
                  filteredReviews.map((review) => (
                    <div className="admin-row admin-row-rich" key={review._id}>
                      <div className="admin-row-main">
                        <div className="admin-row-topline">
                          <strong>
                            {review.rating}/5 cho {review.listing?.title || "tin đăng không rõ"}
                          </strong>
                          <span className={`tag status-${String(review.status || "Published").toLowerCase()}`}>
                            {localizeReviewStatus(review.status || "Published")}
                          </span>
                        </div>
                        <p className="muted">
                          {review.reviewer?.name || "Không rõ"} | {review.reviewee?.name || "Không rõ"}
                        </p>
                        {review.comment ? <p>{review.comment}</p> : <p className="muted">Không có nội dung đánh giá.</p>}
                        {review.moderationNote ? (
                          <p className="admin-note">Ghi chú kiểm duyệt: {review.moderationNote}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions">
                        {review.status === "Hidden" ? (
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={busyKey === `review-${review._id}-Published`}
                            onClick={() => moderateReview(review, "Published")}
                          >
                            Khôi phục đánh giá
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey === `review-${review._id}-Hidden`}
                            onClick={() => moderateReview(review, "Hidden")}
                          >
                            Ẩn đánh giá
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>Không có đánh giá nào khớp với bộ lọc hiện tại.</p>
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

export default AdminPage;
