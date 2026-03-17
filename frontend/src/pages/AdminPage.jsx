import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import api, { parseApiError } from "../services/api";

function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadOverview = async () => {
    try {
      const response = await api.get("/admin/overview");
      setOverview(response.data);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load admin overview"));
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const updateRole = async (userId, role) => {
    setError("");
    setInfo("");
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setInfo(`Updated role to ${role}.`);
      await loadOverview();
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot update role"));
    }
  };

  const deleteListing = async (listingId) => {
    setError("");
    setInfo("");
    try {
      await api.delete(`/listings/${listingId}`);
      setInfo("Listing deleted.");
      await loadOverview();
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot delete listing"));
    }
  };

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>Admin Panel</h1>
          <p className="muted">Manage roles, listings, and overall marketplace activity.</p>
        </div>
      </section>

      <section className="admin-stats">
        <article className="stat-card">
          <span>Total Users</span>
          <strong>{overview?.stats?.totalUsers || 0}</strong>
        </article>
        <article className="stat-card">
          <span>Admins</span>
          <strong>{overview?.stats?.admins || 0}</strong>
        </article>
        <article className="stat-card">
          <span>Listings</span>
          <strong>{overview?.stats?.totalListings || 0}</strong>
        </article>
        <article className="stat-card">
          <span>Meetups</span>
          <strong>{overview?.stats?.totalMeetups || 0}</strong>
        </article>
        <article className="stat-card">
          <span>Reports</span>
          <strong>{overview?.stats?.totalReports || 0}</strong>
        </article>
      </section>

      <section className="admin-layout">
        <article className="panel-card">
          <h2>Users</h2>
          <div className="admin-list">
            {overview?.users?.map((user) => (
              <div className="admin-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <p className="muted">
                    {user.email}
                    {user.username ? ` | username: ${user.username}` : ""}
                  </p>
                </div>
                <div className="admin-actions">
                  <span className={`tag role-${user.role}`}>{user.role}</span>
                  {user.role === "user" ? (
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => updateRole(user.id, "admin")}
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => updateRole(user.id, "user")}
                    >
                      Make User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <h2>Listings</h2>
          <div className="admin-list">
            {overview?.listings?.map((listing) => (
              <div className="admin-row" key={listing._id}>
                <div>
                  <strong>{listing.title}</strong>
                  <p className="muted">
                    {listing.category} | {listing.courseCode || "N/A"} | Seller:{" "}
                    {listing.seller?.name || "Unknown"}
                  </p>
                </div>
                <div className="admin-actions">
                  <span className={`tag status-${(listing.status || "").toLowerCase()}`}>
                    {listing.status}
                  </span>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => deleteListing(listing._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-card">
        <h2>Recent Safety Reports</h2>
        <div className="admin-list">
          {overview?.reports?.length ? (
            overview.reports.map((report) => (
              <div className="admin-row" key={report._id}>
                <div>
                  <strong>{report.reason}</strong>
                  <p className="muted">
                    Reporter: {report.reporter?.name || "Unknown"} | Target:{" "}
                    {report.targetListing?.title || report.targetUser?.name || report.targetType}
                  </p>
                  {report.details ? <p className="muted">{report.details}</p> : null}
                </div>
                <div className="admin-actions">
                  <span className="tag status-reserved">{report.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No safety reports yet.</p>
          )}
        </div>
      </section>

      {error ? <p className="feedback error">{error}</p> : null}
      {info ? <p className="feedback success">{info}</p> : null}
    </AppShell>
  );
}

export default AdminPage;
