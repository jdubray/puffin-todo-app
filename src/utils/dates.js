/**
 * @module dates
 * @description Date formatting and relative time helpers.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7  * DAY;

/**
 * Returns a human-readable relative time string (e.g., "2 hours ago", "in 3 days").
 * @param {string|Date|number} dateInput
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export const relativeTime = (dateInput, now = new Date()) => {
  const date = new Date(dateInput);
  const diffMs = date.getTime() - now.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (absDiff < MINUTE)  return isPast ? 'just now' : 'in a moment';
  if (absDiff < HOUR)    return `${prefix}${Math.round(absDiff / MINUTE)}m${suffix}`;
  if (absDiff < DAY)     return `${prefix}${Math.round(absDiff / HOUR)}h${suffix}`;
  if (absDiff < 2 * DAY) return isPast ? 'yesterday' : 'tomorrow';
  if (absDiff < WEEK)    return `${prefix}${Math.round(absDiff / DAY)}d${suffix}`;

  return formatShortDate(date);
};

/**
 * Formats a date as "Apr 3" or "Apr 3, 2025" (when year differs from current).
 * @param {string|Date|number} dateInput
 * @returns {string}
 */
export const formatShortDate = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const opts = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return date.toLocaleDateString(undefined, opts);
};

/**
 * Returns true if the given date is today.
 * @param {string|Date|number} dateInput
 * @returns {boolean}
 */
export const isToday = (dateInput) => {
  const date = new Date(dateInput);
  const now  = new Date();
  return (
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()
  );
};

/**
 * Returns true if the given date has already passed.
 * @param {string|Date|number} dateInput
 * @returns {boolean}
 */
export const isOverdue = (dateInput) => new Date(dateInput) < new Date();

/**
 * Returns true if the date is within the next `hours` hours.
 * @param {string|Date|number} dateInput
 * @param {number} [hours=24]
 * @returns {boolean}
 */
export const isDueSoon = (dateInput, hours = 24) => {
  const date = new Date(dateInput);
  const now  = new Date();
  return date > now && date.getTime() - now.getTime() < hours * HOUR;
};

/**
 * Returns the start of the day (midnight) for a given date.
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns an ISO 8601 date string for today.
 * @returns {string}
 */
export const todayISO = () => new Date().toISOString();
