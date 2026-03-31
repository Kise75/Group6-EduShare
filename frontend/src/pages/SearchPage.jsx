import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ListingCard from "../components/ListingCard";
import { ListingGridSkeleton } from "../components/SkeletonBlocks";
import { useI18n } from "../context/I18nContext";
import api, { parseApiError } from "../services/api";

const initialFilters = {
  category: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  location: "",
  sortBy: "relevance",
};

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { language, t } = useI18n();
  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMeta, setSearchMeta] = useState({ usedFuzzy: false });

  const activeParams = useMemo(() => {
    const params = {
      query,
      page: pagination.page,
      limit: 6,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });

    return params;
  }, [filters, pagination.page, query]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError("");
      setSearchMeta({ usedFuzzy: false });
      try {
        const response = await api.get("/search", { params: activeParams });
        setListings(response.data.listings || []);
        setPagination((prev) => ({
          pages: response.data.pagination?.pages || 1,
          page: response.data.pagination?.page || prev.page,
          total: response.data.pagination?.total || 0,
        }));
        setSearchMeta(response.data.searchMeta || { usedFuzzy: false });
      } catch (requestError) {
        setError(parseApiError(requestError, "Cannot search listings"));
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [activeParams]);

  const updateFilter = (key, value) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resultSummary =
    language === "vi"
      ? `${pagination.total || 0} san pham phu hop`
      : `${pagination.total || 0} matching listings`;
  const resetFiltersLabel = language === "vi" ? "Dat lai bo loc" : "Reset filters";
  const fuzzySummary =
    language === "vi"
      ? `Khong tim thay ket qua khop chinh xac cho "${query}". Dang hien thi ket qua gan dung.`
      : `No exact matches found for "${query}". Showing close matches instead.`;
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key]);

  return (
    <AppShell>
      <h1>{t("searchPage.title", "", { query: query || t("searchPage.all") })}</h1>

      <section className="search-layout">
        <aside className="filter-panel">
          <div className="filter-panel-head">
            <h2>{t("searchPage.filters")}</h2>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFilters(initialFilters);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                {resetFiltersLabel}
              </button>
            ) : null}
          </div>
          <label>{t("searchPage.category")}</label>
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
          >
            <option value="">{t("searchPage.category.all")}</option>
            <option value="Textbooks">{t("searchPage.category.textbooks")}</option>
            <option value="Lab Kits">{t("searchPage.category.labkits")}</option>
            <option value="Notes">{t("searchPage.category.notes")}</option>
            <option value="Others">{t("searchPage.category.others")}</option>
          </select>

          <label>{t("searchPage.condition")}</label>
          <select
            value={filters.condition}
            onChange={(event) => updateFilter("condition", event.target.value)}
          >
            <option value="">{t("searchPage.condition.any")}</option>
            <option value="New">{t("listing.condition.new")}</option>
            <option value="Good">{t("listing.condition.good")}</option>
            <option value="Fair">{t("listing.condition.fair")}</option>
            <option value="Poor">{t("listing.condition.poor")}</option>
          </select>

          <label>{t("searchPage.priceRange")}</label>
          <div className="inline-two">
            <input
              type="number"
              min="0"
              step="1000"
              placeholder={t("searchPage.min")}
              value={filters.minPrice}
              onChange={(event) => updateFilter("minPrice", event.target.value)}
            />
            <input
              type="number"
              min="0"
              step="1000"
              placeholder={t("searchPage.max")}
              value={filters.maxPrice}
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
            />
          </div>

          <label>{t("searchPage.location")}</label>
          <input
            placeholder={t("searchPage.locationPlaceholder")}
            value={filters.location}
            onChange={(event) => updateFilter("location", event.target.value)}
          />

          <label>{t("searchPage.sortBy")}</label>
          <select
            value={filters.sortBy}
            onChange={(event) => updateFilter("sortBy", event.target.value)}
          >
            <option value="relevance">{t("searchPage.sort.relevance")}</option>
            <option value="newest">{t("searchPage.sort.newest")}</option>
            <option value="price-low">{t("searchPage.sort.lowHigh")}</option>
            <option value="price-high">{t("searchPage.sort.highLow")}</option>
          </select>
        </aside>

        <div>
          <div className="search-results-head">
            <strong>{resultSummary}</strong>
            {searchMeta.usedFuzzy && query ? (
              <p className="search-results-note">{fuzzySummary}</p>
            ) : null}
          </div>
          {error ? <p className="feedback error">{error}</p> : null}

          {loading && !error ? <ListingGridSkeleton count={6} /> : null}

          {!loading && !error ? (
            <section className="listing-grid">
              {listings.length ? (
                listings.map((listing) => <ListingCard compact key={listing._id} listing={listing} />)
              ) : (
                <div className="empty-block">
                  <p>{t("searchPage.empty")}</p>
                </div>
              )}
            </section>
          ) : null}

          <div className="pager">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
            >
              {t("searchPage.previous")}
            </button>
            <span>
              {pagination.page} / {Math.max(pagination.pages || 1, 1)}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.pages, prev.page + 1),
                }))
              }
            >
              {t("searchPage.next")}
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default SearchPage;
