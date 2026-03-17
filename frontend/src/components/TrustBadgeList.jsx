import { useI18n } from "../context/I18nContext";
import { localizeBadgeLabel } from "../utils/localeHelpers";

function TrustBadgeList({ badges = [], compact = false }) {
  const { t } = useI18n();

  if (!badges.length) {
    return null;
  }

  return (
    <div className={`trust-badge-list ${compact ? "compact" : ""}`}>
      {badges.map((badge) => (
        <span key={badge.label} className={`trust-badge ${badge.tone || "neutral"}`}>
          {localizeBadgeLabel(badge.label, t)}
        </span>
      ))}
    </div>
  );
}

export default TrustBadgeList;
