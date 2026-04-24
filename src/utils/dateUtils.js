import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * Parses a date string (YYYY-MM-DD or ISO) to a Date object
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  return typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
};

/**
 * Formats a Date object or string to YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  const d = parseDate(date);
  return format(d, 'yyyy-MM-dd');
};

/**
 * Formats a date for display (e.g., 2026/04/20)
 */
export const formatDateDisplay = (date) => {
  const d = parseDate(date);
  return format(d, 'yyyy/MM/dd', { locale: ja });
};

/**
 * Gets the localized day of the week short string (e.g., '月')
 */
export const getDayOfWeek = (date) => {
  const d = parseDate(date);
  return format(d, 'E', { locale: ja });
};

/**
 * Gets the month string (e.g., '2026-04')
 */
export const getMonthString = (date) => {
  const d = parseDate(date);
  return format(d, 'yyyy-MM');
};
