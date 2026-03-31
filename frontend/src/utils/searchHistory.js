const SEARCH_HISTORY_KEY = "edushare_search_history";
const MAX_SEARCH_HISTORY = 6;

const isBrowser = typeof window !== "undefined";

const normalizeQuery = (query) => String(query || "").trim().replace(/\s+/g, " ");

const readHistory = () => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(normalizeQuery).filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const writeHistory = (items) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
};

export const getSearchHistory = () => readHistory();

export const pushSearchHistory = (query) => {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return readHistory();
  }

  const currentHistory = readHistory().filter(
    (item) => item.toLowerCase() !== normalizedQuery.toLowerCase()
  );
  const nextHistory = [normalizedQuery, ...currentHistory].slice(0, MAX_SEARCH_HISTORY);
  writeHistory(nextHistory);
  return nextHistory;
};

export const removeSearchHistoryItem = (query) => {
  const normalizedQuery = normalizeQuery(query);
  const nextHistory = readHistory().filter(
    (item) => item.toLowerCase() !== normalizedQuery.toLowerCase()
  );
  writeHistory(nextHistory);
  return nextHistory;
};

export const clearSearchHistory = () => {
  writeHistory([]);
  return [];
};
