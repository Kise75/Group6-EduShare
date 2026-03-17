import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import api, { parseApiError } from "../services/api";
import { formatVnd } from "../utils/formatCurrency";

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [reviewAvailability, setReviewAvailability] = useState({});
  const [activeReviewId, setActiveReviewId] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);
  const [submittingReviewId, setSubmittingReviewId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get("/meetups/history/me");
        const nextTransactions = response.data || [];
        setTransactions(nextTransactions);

        const completedMeetups = nextTransactions.filter((item) => item.status === "Completed");
        const availabilityEntries = await Promise.all(
          completedMeetups.map(async (item) => {
            try {
              const availabilityResponse = await api.get(`/reviews/can-review/${item._id}`);
              return [item._id, availabilityResponse.data];
            } catch (requestError) {
              return [item._id, { canReview: false, reason: "Cannot verify review eligibility" }];
            }
          })
        );

        setReviewAvailability(Object.fromEntries(availabilityEntries));
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot load transaction history"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const openReview = (meetupId) => {
    setActiveReviewId(meetupId);
    setReviewForm({ rating: 5, comment: "" });
  };

  const submitReview = async (meetupId) => {
    setError("");
    setSuccess("");
    setSubmittingReviewId(meetupId);
    try {
      await api.post("/reviews", {
        meetupId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setSuccess("Review submitted.");
      setActiveReviewId("");
      setReviewAvailability((prev) => ({
        ...prev,
        [meetupId]: { canReview: false, reason: "Already reviewed" },
      }));
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot submit review"));
    } finally {
      setSubmittingReviewId("");
    }
  };

  return (
    <AppShell>
      <h1>Transaction History</h1>

      <section className="transactions-list">
        {loading ? (
          <div className="panel-card">
            <p className="muted">Loading transaction history...</p>
          </div>
        ) : transactions.length ? (
          transactions.map((item) => (
            <article key={item._id} className="transaction-card">
              <div>
                <p>
                  <strong>Listing:</strong> {item.listing?.title || "N/A"}
                </p>
                <p>
                  <strong>Price:</strong> {formatVnd(item.listing?.price)}
                </p>
                <p>
                  <strong>Location:</strong> {item.location}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(item.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {item.time}
                </p>
                <p>
                  <strong>Status:</strong> {item.status}
                </p>
                <p>
                  <strong>Confirmed:</strong> {item.buyerConfirmed ? "Buyer ok" : "Buyer pending"} |{" "}
                  {item.sellerConfirmed ? "Seller ok" : "Seller pending"}
                </p>
              </div>
              <div>
                <span className={`tag status-${String(item.status || "pending").toLowerCase()}`}>
                  {item.status}
                </span>
                {item.status === "Completed" ? (
                  reviewAvailability[item._id]?.canReview ? (
                    <button className="btn btn-primary" type="button" onClick={() => openReview(item._id)}>
                      Rate/Review
                    </button>
                  ) : (
                    <span className="admin-note">
                      {reviewAvailability[item._id]?.reason || "Review unavailable"}
                    </span>
                  )
                ) : null}
              </div>

              {activeReviewId === item._id ? (
                <div className="review-box">
                  <label>Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(event) =>
                      setReviewForm((prev) => ({ ...prev, rating: event.target.value }))
                    }
                  >
                    <option value={5}>5</option>
                    <option value={4}>4</option>
                    <option value={3}>3</option>
                    <option value={2}>2</option>
                    <option value={1}>1</option>
                  </select>

                  <label>Comment</label>
                  <textarea
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                    }
                    placeholder="Share your feedback..."
                  />
                  <div className="action-row">
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={submittingReviewId === item._id}
                      onClick={() => submitReview(item._id)}
                    >
                      {submittingReviewId === item._id ? "Submitting..." : "Submit Review"}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => setActiveReviewId("")}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="empty-block">
            <p>No transaction history yet.</p>
          </div>
        )}
      </section>

      {error ? <p className="feedback error">{error}</p> : null}
      {success ? <p className="feedback success">{success}</p> : null}
    </AppShell>
  );
}

export default TransactionsPage;
