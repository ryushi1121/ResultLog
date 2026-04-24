/**
 * Formats a number to currency string (e.g., 30000 -> "30,000")
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0';
  return new Intl.NumberFormat('ja-JP').format(amount);
};

/**
 * Formats a number to currency with symbol sign and plus/minus (e.g., +15000 -> "+15,000")
 */
export const formatProfit = (amount) => {
  if (amount === undefined || amount === null) return '0';
  const formatted = new Intl.NumberFormat('ja-JP').format(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return '0';
};
