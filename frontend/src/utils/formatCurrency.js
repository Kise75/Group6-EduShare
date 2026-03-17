const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVnd(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return vndFormatter.format(0);
  }

  return vndFormatter.format(amount);
}
