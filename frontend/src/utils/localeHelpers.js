export const localizeStatus = (value, t) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "active") {
    return t("listing.status.active");
  }
  if (normalized === "reserved") {
    return t("listing.status.reserved");
  }
  if (normalized === "sold") {
    return t("listing.status.sold");
  }
  if (normalized === "pending") {
    return t("listing.status.pending");
  }
  if (normalized === "confirmed") {
    return t("listing.status.confirmed");
  }

  return value || "";
};

export const localizeCondition = (value, t) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "new") {
    return t("listing.condition.new");
  }
  if (normalized === "good") {
    return t("listing.condition.good");
  }
  if (normalized === "fair") {
    return t("listing.condition.fair");
  }
  if (normalized === "poor") {
    return t("listing.condition.poor");
  }

  return value || "";
};

export const localizeBadgeLabel = (value, t) => {
  const label = String(value || "").trim();

  if (label === "Verified Student") {
    return t("listing.badge.verified");
  }
  if (label === "Trusted Seller") {
    return t("listing.badge.trusted");
  }
  if (label === "Fast Responder") {
    return t("listing.badge.fast");
  }
  if (label === "Campus Regular") {
    return t("listing.badge.campus");
  }

  return label;
};

export const localizeRecommendationReason = (value, t) => {
  const reason = String(value || "").trim();

  if (!reason) {
    return "";
  }

  if (reason.startsWith("Matches course code ")) {
    return `${t("listing.reason.courseMatch")} ${reason.replace("Matches course code ", "")}`;
  }
  if (reason === "Competitive price compared with similar listings") {
    return t("listing.reason.price");
  }
  if (reason === "Meetup point is close to campus center") {
    return t("listing.reason.distance");
  }
  if (reason === "Strong title and keyword overlap") {
    return t("listing.reason.keyword");
  }
  if (reason === "Fresh listing with recent activity") {
    return t("listing.reason.fresh");
  }
  if (reason === "Condition quality is above average") {
    return t("listing.reason.condition");
  }

  return reason;
};

export const localizeCampusLocation = (value, t) => {
  const label = String(value || "").trim();

  if (label === "Learning Resource Center") {
    return t("listing.location.library");
  }
  if (label === "Student Support Center") {
    return t("listing.location.supportCenter");
  }
  if (label === "Gate A - 3/2 Street") {
    return t("listing.location.gateA");
  }
  if (label === "Student Cafeteria") {
    return t("listing.location.cafeteria");
  }
  if (label === "Sports Complex Courtyard") {
    return t("listing.location.sports");
  }

  return label;
};
