import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";

function FloatingCreateButton({ unreadMessages = "" }) {
  const { t } = useI18n();

  return (
    <div className="floating-action-dock">
      <Link to="/messages" className="floating-message-button" aria-label={t("nav.messagesAria")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 6.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9.5L5 20v-3.5H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadMessages ? <span className="floating-message-count">{unreadMessages}</span> : null}
      </Link>
      <Link to="/listing/new" className="floating-create-button" aria-label={t("nav.createListing")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </Link>
    </div>
  );
}

export default FloatingCreateButton;
