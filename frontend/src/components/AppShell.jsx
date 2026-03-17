import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import DisplayPreferences from "./DisplayPreferences";
import FloatingCreateButton from "./FloatingCreateButton";
import NotificationBell from "./NotificationBell";
import { localizeCampusLocation } from "../utils/localeHelpers";

function AppShell({ children }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const searchWrapRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const menuLinks = useMemo(() => {
    const base = [
      { label: t("nav.wishlist"), to: "/saved" },
      { label: t("nav.messages"), to: "/messages" },
      { label: t("nav.profile"), to: "/profile" },
      { label: t("nav.admin"), to: "/admin", admin: true },
    ];

    return base.filter((item) => isAuthenticated && (!item.admin || isAdmin));
  }, [isAdmin, isAuthenticated, t]);

  useEffect(() => {
    const nextQuery = new URLSearchParams(location.search).get("q") || "";
    setSearchText(nextQuery);
  }, [location.search]);

  useEffect(() => {
    setMenuOpen(false);
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
    const keyword = searchText.trim();

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
  }, [searchText]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchText.trim();

    if (!query) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const openSearchResult = (listingId) => {
    setSearchFocused(false);
    setSearchSuggestions([]);
    navigate(`/listing/${listingId}`);
  };

  const openAllResults = () => {
    setSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
  };

  return (
    <main className="page-wrap">
      <section className="shell-panel">
        <header className="top-nav">
          <div className="nav-main-row">
            <div className="nav-brand-group">
              <Link to="/" className="brand">
                EduShare
              </Link>
            </div>

            <form className="nav-search" onSubmit={handleSearchSubmit} ref={searchWrapRef}>
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder={t("nav.searchPlaceholder")}
                aria-label={t("nav.search")}
              />
              <button className="btn btn-primary" type="submit">
                {t("nav.search")}
              </button>
              {searchFocused && searchText.trim().length >= 2 ? (
                <div className="nav-search-dropdown">
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
                          <strong>{listing.title}</strong>
                          <span>{listing.courseCode || localizeCampusLocation(listing.campusLocation?.name, t)}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="nav-search-view-all"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={openAllResults}
                      >
                        {t("search.viewAll", "", { query: searchText.trim() })}
                      </button>
                    </div>
                  ) : null}
                  {!loadingSuggestions && !searchSuggestions.length ? (
                    <p className="muted">{t("search.noSuggestions")}</p>
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
                        <Link key={item.to} to={item.to} className="user-menu-link">
                          {item.label}
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
        </header>
        <div className="shell-content">{children}</div>
        {isAuthenticated ? <FloatingCreateButton /> : null}
      </section>
    </main>
  );
}

export default AppShell;
