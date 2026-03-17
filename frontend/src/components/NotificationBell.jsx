import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";

const POLL_INTERVAL = 8000;

function NotificationBell() {
  const navigate = useNavigate();
  const { formatDateTime, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({
    unreadNotifications: 0,
    unreadMessages: 0,
    pendingMeetups: 0,
    totalAttentionItems: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    try {
      const response = await api.get("/notifications/summary");
      setSummary(response.data);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load notifications"));
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
      setSummary(response.data.summary || summary);
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot load notifications"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const timer = window.setInterval(loadSummary, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const badgeCount = useMemo(() => {
    const total = Number(summary.totalAttentionItems || 0);
    return total > 99 ? "99+" : total;
  }, [summary.totalAttentionItems]);

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
        );
        setSummary((prev) => ({
          ...prev,
          unreadNotifications: Math.max(0, (prev.unreadNotifications || 1) - 1),
          totalAttentionItems: Math.max(0, (prev.totalAttentionItems || 1) - 1),
        }));
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot open notification"));
      }
    }

    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setSummary((prev) => ({
        ...prev,
        unreadNotifications: 0,
        totalAttentionItems: prev.pendingMeetups || 0,
      }));
    } catch (requestError) {
      setError(parseApiError(requestError, "Cannot mark all as read"));
    }
  };

  return (
    <div className={`notification-bell ${open ? "open" : ""}`}>
      <button className="notification-trigger" type="button" onClick={() => setOpen((prev) => !prev)}>
        <span>{t("notifications.alerts")}</span>
        {summary.totalAttentionItems ? <span className="notification-count">{badgeCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-dropdown">
          <div className="notification-head">
            <div>
              <strong>{t("notifications.center")}</strong>
              <p className="muted">
                {t("notifications.summary", "", {
                  messages: summary.unreadMessages || 0,
                  meetups: summary.pendingMeetups || 0,
                })}
              </p>
            </div>
            <button className="ghost-link" type="button" onClick={markAllRead}>
              {t("notifications.markAllRead")}
            </button>
          </div>

          {loading ? <p className="muted">{t("notifications.loading")}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}

          {!loading && notifications.length ? (
            <div className="notification-list">
              {notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={`notification-item ${notification.isRead ? "read" : ""}`}
                  onClick={() => openNotification(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </button>
              ))}
            </div>
          ) : null}

          {!loading && !notifications.length ? (
            <div className="empty-block compact">
              <p>{t("notifications.empty")}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
