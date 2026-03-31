const normalizeTrackedCourseCodes = (trackedCourseCodes = []) => {
  if (!Array.isArray(trackedCourseCodes)) {
    return [];
  }

  return [...new Set(
    trackedCourseCodes
      .map((item) => String(item || "").trim().toUpperCase())
      .filter(Boolean)
  )].slice(0, 6);
};

module.exports = {
  normalizeTrackedCourseCodes,
};
