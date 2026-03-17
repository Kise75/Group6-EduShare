const SAVED_ITEMS_KEY = "edushare_saved_items";
const RECENT_ITEMS_KEY = "edushare_recent_items";
const MAX_RECENT_ITEMS = 6;

const isBrowser = typeof window !== "undefined";

const readCollection = (key) => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const writeCollection = (key, value) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeListing = (listing) => ({
  _id: listing._id,
  title: listing.title,
  courseCode: listing.courseCode,
  condition: listing.condition,
  price: listing.price,
  images: listing.images || [],
  category: listing.category,
  seller: listing.seller,
});

export const getSavedItems = () => readCollection(SAVED_ITEMS_KEY);

export const isSavedItem = (listingId) =>
  getSavedItems().some((item) => item._id === listingId);

export const toggleSavedItem = (listing) => {
  const currentItems = getSavedItems();
  const exists = currentItems.some((item) => item._id === listing._id);

  const nextItems = exists
    ? currentItems.filter((item) => item._id !== listing._id)
    : [normalizeListing(listing), ...currentItems];

  writeCollection(SAVED_ITEMS_KEY, nextItems);
  return {
    items: nextItems,
    saved: !exists,
  };
};

export const removeSavedItem = (listingId) => {
  const nextItems = getSavedItems().filter((item) => item._id !== listingId);
  writeCollection(SAVED_ITEMS_KEY, nextItems);
  return nextItems;
};

export const getRecentItems = () => readCollection(RECENT_ITEMS_KEY);

export const pushRecentItem = (listing) => {
  const currentItems = getRecentItems().filter((item) => item._id !== listing._id);
  const nextItems = [normalizeListing(listing), ...currentItems].slice(0, MAX_RECENT_ITEMS);
  writeCollection(RECENT_ITEMS_KEY, nextItems);
  return nextItems;
};
