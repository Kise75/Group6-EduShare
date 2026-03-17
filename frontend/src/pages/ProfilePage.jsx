import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import TrustBadgeList from "../components/TrustBadgeList";
import { useAuth } from "../context/AuthContext";
import api, { parseApiError } from "../services/api";
import { formatVnd } from "../utils/formatCurrency";

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: "", major: "", preferredMeetupLocations: [] });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [listings, setListings] = useState([]);
  const [campusLocations, setCampusLocations] = useState([]);
  const [trustProfile, setTrustProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        major: user.major || "",
        preferredMeetupLocations: user.preferredMeetupLocations || [],
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchProfilePage = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setLoading(true);
        const [listingResponse, trustResponse, locationResponse] = await Promise.all([
          api.get("/listings/user/listings"),
          api.get(`/users/${user.id}/trust`),
          api.get("/meetups/campus-locations"),
        ]);

        setListings(listingResponse.data || []);
        setTrustProfile(trustResponse.data.trustProfile || null);
        setCampusLocations(locationResponse.data || []);
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot load profile page"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePage();
  }, [user?.id]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);
    try {
      const response = await api.put("/users/profile", profile);
      setUser(response.data.user);
      setSuccess("Profile updated successfully.");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingPassword(true);
    try {
      await api.post("/users/change-password", passwordForm);
      setSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot change password"));
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteListing = async (listingId) => {
    const confirmed = window.confirm("Delete this listing permanently?");
    if (!confirmed) {
      return;
    }

    setDeletingListingId(listingId);
    try {
      await api.delete(`/listings/${listingId}`);
      setListings((prev) => prev.filter((item) => item._id !== listingId));
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot delete listing"));
    } finally {
      setDeletingListingId("");
    }
  };

  const toggleLocationPreference = (locationName) => {
    setProfile((prev) => ({
      ...prev,
      preferredMeetupLocations: prev.preferredMeetupLocations.includes(locationName)
        ? prev.preferredMeetupLocations.filter((item) => item !== locationName)
        : [...prev.preferredMeetupLocations, locationName],
    }));
  };

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>My Profile</h1>
          <p className="muted">Manage trust, preferences, and everything related to your campus marketplace identity.</p>
        </div>
      </section>

      <section className="profile-layout">
        <div className="profile-sidebar-stack">
          <div className="panel-card trust-summary-card">
            <h2>Seller Trust Summary</h2>
            <div className="trust-summary-score">
              <strong>{trustProfile?.trustScore || 0}</strong>
              <span>/100</span>
            </div>
            <TrustBadgeList badges={trustProfile?.badges || []} />
            <p>
              <strong>Average rating:</strong> {Number(trustProfile?.averageRating || user?.rating || 0).toFixed(1)} / 5
            </p>
            <p>
              <strong>Completed transactions:</strong> {trustProfile?.completedTransactions || 0}
            </p>
            <p>
              <strong>Cancellation rate:</strong> {trustProfile?.cancellationRate || 0}%
            </p>
            <p>
              <strong>Average response:</strong>{" "}
              {trustProfile?.averageResponseMinutes ? `${trustProfile.averageResponseMinutes} mins` : "No data yet"}
            </p>
            <p>
              <strong>Verification:</strong> {user?.emailVerified ? "Verified student" : "Pending verification"}
            </p>
          </div>

          <form className="panel-card form-stack" onSubmit={updateProfile}>
            <h2>Profile Information</h2>
            <label>Name</label>
            <input
              required
              value={profile.name}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            />

            <label>Email</label>
            <input disabled value={user?.email || ""} />

            <label>Role</label>
            <input disabled value={user?.role || "user"} />

            <label>Major</label>
            <input
              value={profile.major}
              onChange={(event) => setProfile((prev) => ({ ...prev, major: event.target.value }))}
            />

            <label>Preferred Safe Meetup Spots</label>
            <div className="location-pills">
              {campusLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  className={`location-pill ${
                    profile.preferredMeetupLocations.includes(location.name) ? "active" : ""
                  }`}
                  onClick={() => toggleLocationPreference(location.name)}
                >
                  {location.name}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Update Profile"}
            </button>
          </form>

          <form className="panel-card form-stack" onSubmit={changePassword}>
            <h2>Change Password</h2>
            <label>Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
            <label>New Password</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />
            <button className="btn btn-secondary" type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Change Password"}
            </button>
            <Link className="btn btn-secondary" to="/transactions">
              View Transaction History
            </Link>
          </form>
        </div>

        <section>
          <div className="section-head">
            <div>
              <h2>My Listings</h2>
              <p className="muted">Monitor availability, reservation state, and pricing in one place.</p>
            </div>
          </div>
          {loading ? (
            <div className="panel-card">
              <p className="muted">Loading your marketplace profile...</p>
            </div>
          ) : null}
          <div className="listing-grid single-column">
            {!loading && listings.length ? (
              listings.map((listing) => (
                <article className="listing-card compact" key={listing._id}>
                  <div className="listing-image-wrap">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="listing-image" />
                    ) : (
                      <div className="placeholder-image">Image</div>
                    )}
                  </div>
                  <div className="listing-card-topline">
                    <span className={`tag status-${String(listing.status || "active").toLowerCase()}`}>
                      {listing.status}
                    </span>
                    <span
                      className={`tag visibility-${String(listing.visibility || "Visible").toLowerCase()}`}
                    >
                      {listing.visibility || "Visible"}
                    </span>
                    {listing.sellerInsights?.trustScore ? (
                      <span className="trust-score-pill">Trust {listing.sellerInsights.trustScore}/100</span>
                    ) : null}
                  </div>
                  <h3>{listing.title}</h3>
                  <p className="meta">Course Code: {listing.courseCode || "N/A"}</p>
                  <p className="meta">Condition: {listing.condition}</p>
                  <p className="meta">Meetup: {listing.campusLocation?.name || "Flexible"}</p>
                  <p className="price">{formatVnd(listing.price)}</p>
                  {listing.hiddenReason ? (
                    <p className="admin-note warning-note">Moderation note: {listing.hiddenReason}</p>
                  ) : null}
                  <div className="action-row">
                    <Link className="btn btn-primary" to={`/listing/${listing._id}/edit`}>
                      Edit
                    </Link>
                    <button
                      className="btn btn-danger"
                      type="button"
                      disabled={deletingListingId === listing._id}
                      onClick={() => deleteListing(listing._id)}
                    >
                      {deletingListingId === listing._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))
            ) : !loading ? (
              <div className="empty-block">
                <p>No listings found.</p>
                <p className="muted">Use the floating + button to add your first listing.</p>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      {error ? <p className="feedback error">{error}</p> : null}
      {success ? <p className="feedback success">{success}</p> : null}
    </AppShell>
  );
}

export default ProfilePage;
