import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import api, { parseApiError } from "../services/api";

const matchesKeyword = (value, keyword) =>
  !keyword || String(value || "").toLowerCase().includes(keyword);

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
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load admin overview"));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const runAdminAction = async (key, action, fallbackMessage) => {
    setBusyKey(key);
    setError("");
    setInfo("");

    try {
      const response = await action();
      setInfo(response?.data?.message || fallbackMessage);
      await loadOverview(false);
    } catch (requestError) {
      setError(parseApiError(requestError, fallbackMessage));
    } finally {
      setBusyKey("");
    }
  };

  const updateRole = async (userId, role) =>
    runAdminAction(
      `role-${userId}-${role}`,
      () => api.put(`/admin/users/${userId}/role`, { role }),
      "Cannot update role"
    );

  const toggleUserBan = async (user) => {
    if (user.status === "Banned") {
      const confirmed = window.confirm(`Restore ${user.name}'s account? Their hidden listings stay hidden until reviewed.`);
      if (!confirmed) {
        return;
      }

      await runAdminAction(
        `unban-${user.id}`,
        () => api.put(`/admin/users/${user.id}/unban`),
        "Cannot restore user"
      );
      return;
    }

    const reason = window.prompt(
      `Ban reason for ${user.name}:`,
      user.banReason || "Repeated policy violations"
    );

    if (reason === null) {
      return;
    }

    await runAdminAction(
      `ban-${user.id}`,
      () => api.put(`/admin/users/${user.id}/ban`, { reason }),
      "Cannot ban user"
    );
  };

  const toggleListingVisibility = async (listing) => {
    if (listing.visibility === "Hidden") {
      const confirmed = window.confirm(`Unhide "${listing.title}" and return it to the marketplace?`);
      if (!confirmed) {
        return;
      }

      await runAdminAction(
        `unhide-${listing._id}`,
        () => api.put(`/admin/listings/${listing._id}/unhide`),
        "Cannot unhide listing"
      );
      return;
    }

    const reason = window.prompt(
      `Hidden reason for "${listing.title}":`,
      listing.hiddenReason || "Under moderation review"
    );

    if (reason === null) {
      return;
    }

    await runAdminAction(
      `hide-${listing._id}`,
      () => api.put(`/admin/listings/${listing._id}/hide`, { reason }),
      "Cannot hide listing"
    );
  };

  const deleteListing = async (listing) => {
    const confirmed = window.confirm(`Delete "${listing.title}" permanently? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    await runAdminAction(
      `delete-${listing._id}`,
      () => api.delete(`/listings/${listing._id}`),
      "Cannot delete listing"
    );
  };

  const updateReport = async (report, payload, fallbackMessage) =>
    runAdminAction(
      `report-${report._id}-${payload.status}-${payload.actionTaken || "none"}`,
      () => api.put(`/admin/reports/${report._id}`, payload),
      fallbackMessage
    );

  const markReviewed = async (report) => {
    const note = window.prompt("Admin note (optional):", report.resolutionNote || "");
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
      "Cannot update report"
    );
  };

  const resolveReport = async (report, actionTaken = "none") => {
    const defaultNote =
      actionTaken === "listing-hidden"
        ? "Listing hidden after review."
        : actionTaken === "user-banned"
          ? "User suspended after safety review."
          : report.resolutionNote || "";
    const note = window.prompt("Resolution note:", defaultNote);

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
      "Cannot resolve report"
    );
  };

  const dismissReport = async (report) => {
    const note = window.prompt("Dismiss reason:", report.resolutionNote || "No action required");
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
      "Cannot dismiss report"
    );
  };

  const moderateReview = async (review, status) => {
    const defaultNote =
      status === "Hidden"
        ? review.moderationNote || "Hidden pending moderation review."
        : review.moderationNote || "Review restored after moderation review.";
    const note = window.prompt("Moderation note:", defaultNote);

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
      "Cannot moderate review"
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
    { label: "Users", value: overview?.stats?.totalUsers || 0, hint: `${overview?.stats?.bannedUsers || 0} banned` },
    { label: "Listings", value: overview?.stats?.totalListings || 0, hint: `${overview?.stats?.hiddenListings || 0} hidden` },
    { label: "Reports", value: overview?.stats?.totalReports || 0, hint: `${overview?.stats?.openReports || 0} open` },
    { label: "Reviews", value: overview?.stats?.totalReviews || 0, hint: `${overview?.stats?.hiddenReviews || 0} hidden` },
    { label: "Meetups", value: overview?.stats?.totalMeetups || 0, hint: `${overview?.stats?.pendingMeetups || 0} pending` },
    { label: "Reserved", value: overview?.stats?.reservedListings || 0, hint: "Listings awaiting meetup" },
  ];

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>Admin Moderation Hub</h1>
          <p className="muted">
            Review marketplace health, moderate risky activity, and keep EduShare safe for student transactions.
          </p>
        </div>
      </section>

      {error ? <p className="feedback error">{error}</p> : null}
      {info ? <p className="feedback success">{info}</p> : null}

      {loading && !overview ? (
        <section className="panel-card admin-loading-card">
          <h2>Loading moderation dashboard...</h2>
          <p className="muted">Pulling users, listings, reports, reviews, and transaction signals.</p>
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

          <section className="admin-layout admin-layout-expanded">
            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>User Management</h2>
                  <p className="muted">Promote admins, suspend risky accounts, and audit account health.</p>
                </div>
                <div className="admin-toolbar">
                  <input
                    value={userQuery}
                    placeholder="Search name, email, major..."
                    onChange={(event) => setUserQuery(event.target.value)}
                  />
                  <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)}>
                    <option value="all">All users</option>
                    <option value="admin">Admins only</option>
                    <option value="banned">Banned only</option>
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
                            <span className={`tag role-${user.role}`}>{user.role}</span>
                            <span className={`tag status-${String(user.status || "Active").toLowerCase()}`}>
                              {user.status || "Active"}
                            </span>
                          </div>
                        </div>
                        <p className="muted">
                          {user.email}
                          {user.username ? ` | @${user.username}` : ""}
                          {user.major ? ` | ${user.major}` : ""}
                        </p>
                        {user.banReason ? (
                          <p className="admin-note error-note">Ban reason: {user.banReason}</p>
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
                            Make Admin
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={busyKey === `role-${user.id}-user`}
                            onClick={() => updateRole(user.id, "user")}
                          >
                            Make User
                          </button>
                        )}

                        <button
                          className={user.status === "Banned" ? "btn btn-secondary" : "btn btn-danger"}
                          type="button"
                          disabled={busyKey === `ban-${user.id}` || busyKey === `unban-${user.id}`}
                          onClick={() => toggleUserBan(user)}
                        >
                          {user.status === "Banned" ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>No users match the current filter.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Listing Moderation</h2>
                  <p className="muted">Hide risky listings, inspect reservation state, or remove invalid content.</p>
                </div>
                <div className="admin-toolbar">
                  <select value={listingFilter} onChange={(event) => setListingFilter(event.target.value)}>
                    <option value="all">All listings</option>
                    <option value="hidden">Hidden</option>
                    <option value="reported">Reported</option>
                    <option value="reserved">Reserved</option>
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
                              {listing.status}
                            </span>
                            <span
                              className={`tag visibility-${String(listing.visibility || "Visible").toLowerCase()}`}
                            >
                              {listing.visibility || "Visible"}
                            </span>
                          </div>
                        </div>
                        <p className="muted">
                          Seller: {listing.seller?.name || "Unknown"} | {listing.category} |{" "}
                          {listing.courseCode || "No course code"} | Reports: {listing.reportCount || 0}
                        </p>
                        {listing.hiddenReason ? (
                          <p className="admin-note warning-note">Hidden reason: {listing.hiddenReason}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions">
                        <button
                          className={listing.visibility === "Hidden" ? "btn btn-secondary" : "btn btn-danger"}
                          type="button"
                          disabled={busyKey === `hide-${listing._id}` || busyKey === `unhide-${listing._id}`}
                          onClick={() => toggleListingVisibility(listing)}
                        >
                          {listing.visibility === "Hidden" ? "Unhide" : "Hide"}
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          disabled={busyKey === `delete-${listing._id}`}
                          onClick={() => deleteListing(listing)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>No listings match the current moderation filter.</p>
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="admin-layout admin-layout-expanded">
            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Report Resolution Queue</h2>
                  <p className="muted">Track open cases, resolve them cleanly, and record moderation actions.</p>
                </div>
                <div className="admin-toolbar">
                  <select value={reportFilter} onChange={(event) => setReportFilter(event.target.value)}>
                    <option value="all">All reports</option>
                    <option value="open">Open</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved / Dismissed</option>
                  </select>
                </div>
              </div>

              <div className="admin-list">
                {filteredReports.length ? (
                  filteredReports.map((report) => (
                    <div className="admin-row admin-row-rich" key={report._id}>
                      <div className="admin-row-main">
                        <div className="admin-row-topline">
                          <strong>{report.reason}</strong>
                          <div className="admin-chip-row">
                            <span className={`tag status-${String(report.status || "open").toLowerCase()}`}>
                              {report.status}
                            </span>
                            <span className="tag action-tag">{report.actionTaken || "none"}</span>
                          </div>
                        </div>
                        <p className="muted">
                          Reporter: {report.reporter?.name || "Unknown"} | Target:{" "}
                          {report.targetListing?.title || report.targetUser?.name || report.targetType}
                        </p>
                        {report.details ? <p>{report.details}</p> : null}
                        {report.resolutionNote ? (
                          <p className="admin-note">Resolution note: {report.resolutionNote}</p>
                        ) : null}
                      </div>

                      <div className="admin-actions stacked">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => markReviewed(report)}
                        >
                          Mark Reviewed
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => resolveReport(report)}
                        >
                          Resolve
                        </button>
                        {report.targetListing ? (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey.startsWith(`report-${report._id}`)}
                            onClick={() => resolveReport(report, "listing-hidden")}
                          >
                            Resolve + Hide Listing
                          </button>
                        ) : null}
                        {report.targetUser ? (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey.startsWith(`report-${report._id}`)}
                            onClick={() => resolveReport(report, "user-banned")}
                          >
                            Resolve + Ban User
                          </button>
                        ) : null}
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={busyKey.startsWith(`report-${report._id}`)}
                          onClick={() => dismissReport(report)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>No reports in this queue.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="panel-card admin-section-card">
              <div className="admin-section-head">
                <div>
                  <h2>Review Moderation</h2>
                  <p className="muted">Hide abusive reviews, restore valid ones, and keep ratings trustworthy.</p>
                </div>
                <div className="admin-toolbar">
                  <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
                    <option value="all">All reviews</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
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
                            {review.rating}/5 on {review.listing?.title || "Unknown listing"}
                          </strong>
                          <span className={`tag status-${String(review.status || "Published").toLowerCase()}`}>
                            {review.status || "Published"}
                          </span>
                        </div>
                        <p className="muted">
                          {review.reviewer?.name || "Unknown"} → {review.reviewee?.name || "Unknown"}
                        </p>
                        {review.comment ? <p>{review.comment}</p> : <p className="muted">No review comment.</p>}
                        {review.moderationNote ? (
                          <p className="admin-note">Moderation note: {review.moderationNote}</p>
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
                            Restore Review
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            type="button"
                            disabled={busyKey === `review-${review._id}-Hidden`}
                            onClick={() => moderateReview(review, "Hidden")}
                          >
                            Hide Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-block compact">
                    <p>No reviews match the current filter.</p>
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
