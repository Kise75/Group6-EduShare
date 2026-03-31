import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { formatVnd } from "../utils/formatCurrency";
import DisplayPreferences from "./DisplayPreferences";
import FloatingCreateButton from "./FloatingCreateButton";
import NotificationBell from "./NotificationBell";
import { localizeCampusLocation } from "../utils/localeHelpers";
import {
  clearSearchHistory,
  getSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from "../utils/searchHistory";

const MESSAGE_SUMMARY_POLL_INTERVAL = 8000;

function AppShell({ children }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { language, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const searchWrapRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => getSearchHistory());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const keyword = searchText.trim();

  const unreadMessageBadge = useMemo(() => {
    if (!unreadMessages) {
      return "";
    }

    return unreadMessages > 99 ? "99+" : String(unreadMessages);
  }, [unreadMessages]);

  const menuLinks = useMemo(() => {
    const base = [
      { label: t("nav.wishlist"), to: "/saved" },
      { label: t("nav.messages"), to: "/messages", badge: unreadMessageBadge },
      { label: t("nav.profile"), to: "/profile" },
      { label: t("nav.admin"), to: "/admin", admin: true },
    ];

    return base.filter((item) => isAuthenticated && (!item.admin || isAdmin));
  }, [isAdmin, isAuthenticated, t, unreadMessageBadge]);

  const shortcutLinks = useMemo(() => {
    const base = [
      { label: t("nav.home"), to: "/" },
      { label: t("nav.search"), to: "/search" },
    ];

    if (!isAuthenticated) {
      return base;
    }

    const memberLinks = [
      { label: t("nav.wishlist"), to: "/saved" },
      { label: t("nav.messages"), to: "/messages", badge: unreadMessageBadge },
      { label: t("nav.profile"), to: "/profile" },
    ];

    if (isAdmin) {
      memberLinks.push({ label: t("nav.admin"), to: "/admin" });
    }

    return [...base, ...memberLinks];
  }, [isAdmin, isAuthenticated, t, unreadMessageBadge]);

  const searchCopy = useMemo(
    () =>
      language === "vi"
        ? {
            history: "Lich su tim kiem",
            clearHistory: "Xoa lich su",
            noHistory: "Chua co lich su tim kiem.",
            recentHint: "Chon mot tu khoa de tim lai nhanh.",
            recentTag: "Gan day",
            clearInput: "Xoa noi dung tim kiem",
            removeHistoryItem: "Xoa muc nay",
          }
        : {
            history: "Search History",
            clearHistory: "Clear history",
            noHistory: "No recent searches yet.",
            recentHint: "Pick a recent keyword to search again quickly.",
            recentTag: "Recent",
            clearInput: "Clear search text",
            removeHistoryItem: "Remove this item",
          },
    [language]
  );

  useEffect(() => {
    setMenuOpen(false);
    setSearchFocused(false);
    setSearchSuggestions([]);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) {
        setSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return undefined;
    }

    let active = true;
    const loadMessageSummary = async () => {
      try {
        const response = await api.get("/notifications/summary");

        if (active) {
          setUnreadMessages(Number(response.data?.unreadMessages || 0));
        }
      } catch (error) {
        if (active) {
          setUnreadMessages(0);
        }
      }
    };

    loadMessageSummary();
    const timer = window.setInterval(loadMessageSummary, MESSAGE_SUMMARY_POLL_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, location.pathname, location.search]);

  useEffect(() => {
    if (keyword.length < 2) {
      setSearchSuggestions([]);
      setLoadingSuggestions(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await api.get("/search", {
          params: {
            query: keyword,
            page: 1,
            limit: 5,
          },
        });

        if (active) {
          setSearchSuggestions(response.data.listings || []);
        }
      } catch (error) {
        if (active) {
          setSearchSuggestions([]);
        }
      } finally {
        if (active) {
          setLoadingSuggestions(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const closeSearchDropdown = () => {
    setSearchFocused(false);
    setSearchSuggestions([]);
  };

  const finalizeSearch = (query) => {
    const normalizedQuery = String(query || "").trim();

    if (!normalizedQuery) {
      navigate("/search");
      setSearchText("");
      closeSearchDropdown();
      return;
    }

    const nextHistory = pushSearchHistory(normalizedQuery);
    setSearchHistory(nextHistory);
    setSearchText("");
    closeSearchDropdown();
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    finalizeSearch(keyword);
  };

  const openSearchResult = (listingId) => {
    closeSearchDropdown();
    navigate(`/listing/${listingId}`);
  };

  const openAllResults = () => {
    finalizeSearch(keyword);
  };

  const getSuggestionSubtitle = (listing) =>
    listing.courseCode || localizeCampusLocation(listing.campusLocation?.name, t) || listing.category;

  const handleBrandClick = (event) => {
    event.preventDefault();
    setSearchText("");
    closeSearchDropdown();
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      closeSearchDropdown();
      event.currentTarget.blur();
    }
  };

  const handlePickHistoryItem = (query) => {
    finalizeSearch(query);
  };

  const handleRemoveHistoryItem = (event, query) => {
    event.preventDefault();
    event.stopPropagation();
    setSearchHistory(removeSearchHistoryItem(query));
  };

  const handleClearHistory = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSearchHistory(clearSearchHistory());
  };

  const isActivePath = (targetPath) => {
    if (targetPath === "/") {
      return location.pathname === "/";
    }

    return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
  };

  return (
    <main className="page-wrap">
      <section className="shell-panel">
        <header className="top-nav">
          <div className="nav-main-row">
            <div className="nav-brand-group">
              <Link to="/" className="brand" onClick={handleBrandClick}>
                EduShare
              </Link>
            </div>

            <form className="nav-search" onSubmit={handleSearchSubmit} ref={searchWrapRef}>
              <div className="nav-search-field">
                <input
                  type="search"
                  value={searchText}
                  autoComplete="off"
                  onChange={(event) => setSearchText(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t("nav.searchPlaceholder")}
                  aria-label={t("nav.search")}
                />
                {searchText ? (
                  <button
                    type="button"
                    className="nav-search-clear"
                    aria-label={searchCopy.clearInput}
                    onClick={() => setSearchText("")}
                  >
                    x
                  </button>
                ) : null}
              </div>
              <button className="btn btn-primary" type="submit">
                {t("nav.search")}
              </button>
              {searchFocused ? (
                <div className="nav-search-dropdown">
                  {searchHistory.length ? (
                    <section className="nav-search-section">
                      <div className="nav-search-section-head">
                        <strong className="nav-search-label">{searchCopy.history}</strong>
                        <button
                          type="button"
                          className="nav-search-inline-action"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={handleClearHistory}
                        >
                          {searchCopy.clearHistory}
                        </button>
                      </div>
                      <p className="nav-search-helper">{searchCopy.recentHint}</p>
                      <div className="nav-search-history-list">
                        {searchHistory.map((item) => (
                          <div key={item} className="nav-search-history-item">
                            <button
                              type="button"
                              className="nav-search-history-select"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handlePickHistoryItem(item)}
                            >
                              <span className="nav-search-history-text">{item}</span>
                            </button>
                            <span className="nav-search-history-actions">
                              <span className="nav-search-history-tag">{searchCopy.recentTag}</span>
                              <button
                                type="button"
                                className="nav-search-history-remove"
                                aria-label={searchCopy.removeHistoryItem}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={(event) => handleRemoveHistoryItem(event, item)}
                              >
                                x
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {keyword.length >= 2 ? (
                    <section className="nav-search-section">
                      <strong className="nav-search-label">{t("search.suggestions")}</strong>
                      {loadingSuggestions ? <p className="muted">{t("searchPage.loading")}</p> : null}
                      {!loadingSuggestions && searchSuggestions.length ? (
                        <div className="nav-search-suggestion-list">
                          {searchSuggestions.map((listing) => (
                            <button
                              key={listing._id}
                              type="button"
                              className="nav-search-suggestion"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => openSearchResult(listing._id)}
                            >
                              <div className="nav-search-suggestion-thumb">
                                {listing.images?.[0] ? (
                                  <img src={listing.images[0]} alt={listing.title} className="listing-image" />
                                ) : (
                                  <div className="placeholder-image">{t("listing.detail.image")}</div>
                                )}
                              </div>
                              <div className="nav-search-suggestion-body">
                                <strong>{listing.title}</strong>
                                <span className="nav-search-suggestion-meta">
                                  <span>{getSuggestionSubtitle(listing)}</span>
                                  <span className="nav-search-suggestion-price">
                                    {formatVnd(listing.price)}
                                  </span>
                                </span>
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            className="nav-search-view-all"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={openAllResults}
                          >
                            {t("search.viewAll", "", { query: keyword })}
                          </button>
                        </div>
                      ) : null}
                      {!loadingSuggestions && !searchSuggestions.length ? (
                        <p className="muted">{t("search.noSuggestions")}</p>
                      ) : null}
                    </section>
                  ) : null}

                  {!searchHistory.length && keyword.length < 2 ? (
                    <p className="muted">{searchCopy.noHistory}</p>
                  ) : null}
                </div>
              ) : null}
            </form>

            <div className="nav-utility-cluster">
              {isAuthenticated ? <NotificationBell /> : null}
              <DisplayPreferences />

              {!isAuthenticated ? (
                <Link to="/auth" className="btn btn-primary nav-auth-link">
                  {t("nav.login")}
                </Link>
              ) : (
                <div className={`user-menu ${menuOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="user-menu-trigger"
                    aria-label={t("nav.openMenu")}
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <span className="user-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</span>
                    <span className="user-menu-text">
                      <strong>{user?.name?.split(" ")[0] || t("nav.account")}</strong>
                      <small>{user?.role === "admin" ? t("nav.admin") : t("nav.account")}</small>
                    </span>
                  </button>

                  {menuOpen ? (
                    <div className="user-menu-dropdown">
                      {menuLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`user-menu-link ${isActivePath(item.to) ? "active" : ""}`}
                        >
                          <span>{item.label}</span>
                          {item.badge ? <span className="user-menu-link-badge">{item.badge}</span> : null}
                        </Link>
                      ))}
                      <button className="user-menu-link danger" type="button" onClick={logout}>
                        {t("nav.logout")}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <nav className="nav-shortcuts" aria-label="Quick navigation">
            {shortcutLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-shortcut ${isActivePath(item.to) ? "active" : ""}`}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="nav-shortcut-badge">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>
        </header>
        <div className="shell-content">{children}</div>
        {isAuthenticated ? <FloatingCreateButton unreadMessages={unreadMessageBadge} /> : null}
      </section>
    </main>
  );
}

export default AppShell;
