import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../context/AuthContext";
import api, { parseApiError } from "../services/api";
import { getSavedItems, removeSavedItem } from "../utils/itemCollections";

function SavedItemsPage() {
  const { isAuthenticated } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [trackedCourseCodes, setTrackedCourseCodes] = useState([]);
  const [alertFeed, setAlertFeed] = useState([]);
  const [courseMatches, setCourseMatches] = useState([]);
  const [alertSummary, setAlertSummary] = useState({ unreadCourseMatchCount: 0 });
  const [courseCode, setCourseCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadWishlist = async () => {
    setError("");
    try {
      if (!isAuthenticated) {
        setSavedItems(getSavedItems());
        setTrackedCourseCodes([]);
        setAlertFeed([]);
        setCourseMatches([]);
        setAlertSummary({ unreadCourseMatchCount: 0 });
        return;
      }

      const response = await api.get("/wishlist");
      setSavedItems(response.data.savedListings || []);
      setTrackedCourseCodes(response.data.trackedCourseCodes || []);
      setAlertFeed(response.data.alertFeed || []);
      setCourseMatches(response.data.courseMatches || []);
      setAlertSummary(response.data.alertSummary || { unreadCourseMatchCount: 0 });
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load wishlist"));
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (listing) => {
    setInfo("");
    if (!isAuthenticated) {
      const nextItems = removeSavedItem(listing._id);
      setSavedItems(nextItems);
      return;
    }

    try {
      await api.delete(`/wishlist/listings/${listing._id}`);
      setSavedItems((prev) => prev.filter((item) => item._id !== listing._id));
      setInfo("Removed from wishlist.");
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot remove wishlist item"));
    }
  };

  const addTrackedCode = async (event) => {
    event.preventDefault();
    setInfo("");
    setError("");

    try {
      const response = await api.post("/wishlist/course-codes", { courseCode });
      setTrackedCourseCodes(response.data.trackedCourseCodes || []);
      setCourseCode("");
      setInfo("Course code alert added.");
      await loadWishlist();
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot add tracked course code"));
    }
  };

  const removeTrackedCode = async (targetCode) => {
    setInfo("");
    try {
      const response = await api.delete(`/wishlist/course-codes/${targetCode}`);
      setTrackedCourseCodes(response.data.trackedCourseCodes || []);
      await loadWishlist();
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot remove tracked course code"));
    }
  };

  return (
    <AppShell>
      <section className="section-head">
        <div>
          <h1>Wishlist + Alerts</h1>
          <p className="muted">
            Save listings, track course codes, and get notified when matching books appear or prices drop.
          </p>
        </div>
      </section>

      {!isAuthenticated ? (
        <div className="panel-card">
          <p className="muted">
            You are viewing local saved items only. <Link to="/auth">Log in</Link> to sync wishlist alerts and course tracking.
          </p>
        </div>
      ) : (
        <section className="wishlist-layout">
          <div className="panel-card form-stack">
            <h2>Track a Course Code</h2>
            <p className="muted">
              Follow the course codes you care about and EduShare will notify you when matching books or notes are posted.
            </p>
            <form className="inline-two" onSubmit={addTrackedCode}>
              <input
                value={courseCode}
                placeholder="e.g. MATH101"
                onChange={(event) => setCourseCode(event.target.value.toUpperCase())}
              />
              <button className="btn btn-primary" type="submit">
                Add Alert
              </button>
            </form>

            <div className="tracked-code-list">
              {trackedCourseCodes.length ? (
                trackedCourseCodes.map((item) => (
                  <button key={item} type="button" className="tracked-code-pill" onClick={() => removeTrackedCode(item)}>
                    {item} x
                  </button>
                ))
              ) : (
                <p className="muted">No course alerts yet.</p>
              )}
            </div>
          </div>

          <div className="panel-card">
            <h2>Alert Feed</h2>
            {alertSummary.unreadCourseMatchCount ? (
              <p className="muted">
                {alertSummary.unreadCourseMatchCount} unread alert
                {alertSummary.unreadCourseMatchCount === 1 ? "" : "s"} for tracked course codes.
              </p>
            ) : null}
            <div className="alert-feed">
              {alertFeed.length ? (
                alertFeed.map((item) => (
                  <article key={item._id} className="alert-feed-item">
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <div className="alert-feed-meta">
                      <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
                      {item.link ? (
                        <Link className="btn btn-secondary" to={item.link}>
                          Open Listing
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">Your personalized alerts will appear here.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {isAuthenticated ? (
        <section className="course-match-section">
          <div className="section-head">
            <div>
              <h2>New Matches For Your Course Codes</h2>
              <p className="muted">
                Fresh listings that match the course codes you are following, so you can jump on good books sooner.
              </p>
            </div>
          </div>

          {courseMatches.length ? (
            <section className="listing-grid">
              {courseMatches.map((listing) => (
                <ListingCard key={listing._id} listing={listing} compact />
              ))}
            </section>
          ) : (
            <div className="empty-block">
              <p>No fresh matches yet.</p>
              <p className="muted">
                Add a course code like MATH101 or CS101 and matching listings will show up here automatically.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {savedItems.length ? (
        <section className="listing-grid">
          {savedItems.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              saved
              onToggleSave={handleRemove}
              saveLabel="Remove Saved"
            />
          ))}
        </section>
      ) : (
        <div className="empty-block">
          <p>No saved items yet.</p>
          <p className="muted">Use the Save button on any listing to build your shortlist.</p>
        </div>
      )}

      {error ? <p className="feedback error">{error}</p> : null}
      {info ? <p className="feedback success">{info}</p> : null}
    </AppShell>
  );
}

export default SavedItemsPage;
