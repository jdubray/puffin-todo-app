/**
 * @module recurrence
 * @description Computes the next occurrence date for recurring tasks.
 */

/**
 * @typedef {Object} RecurrenceRule
 * @property {'daily'|'weekly'|'monthly'|'weekdays'} type
 * @property {number}   [interval=1]   - Every N periods
 * @property {number[]} [daysOfWeek]   - 0=Sun…6=Sat, used with 'weekly'
 * @property {number}   [dayOfMonth]   - 1–31, used with 'monthly'
 */

/**
 * Returns the next occurrence date after `from` for the given rule.
 *
 * @param {RecurrenceRule} rule
 * @param {string|Date}    from - ISO string or Date to start from
 * @returns {Date}
 */
export const nextOccurrence = (rule, from) => {
  const base = new Date(from);
  const interval = rule.interval ?? 1;

  switch (rule.type) {
    case 'daily':
      return _addDays(base, interval);

    case 'weekly': {
      if (!rule.daysOfWeek?.length) return _addDays(base, 7 * interval);
      return _nextWeekDay(base, rule.daysOfWeek, interval);
    }

    case 'weekdays': {
      let next = _addDays(base, 1);
      while (_isWeekend(next)) next = _addDays(next, 1);
      return next;
    }

    case 'monthly': {
      const next = new Date(base);
      next.setMonth(next.getMonth() + interval);
      if (rule.dayOfMonth) {
        next.setDate(Math.min(rule.dayOfMonth, _daysInMonth(next)));
      }
      return next;
    }

    default:
      throw new Error(`Unknown recurrence type: ${rule.type}`);
  }
};

/**
 * Parses a recurrence description string into a RecurrenceRule.
 * Handles: "daily", "every day", "weekly", "every week",
 *          "every Monday", "every Monday and Wednesday",
 *          "monthly", "every month", "weekdays"
 *
 * @param {string} text
 * @returns {RecurrenceRule|null}
 */
export const parseRecurrence = (text) => {
  const t = text.toLowerCase().trim();

  if (/\bevery\s+day\b|daily/.test(t))      return { type: 'daily',    interval: 1 };
  if (/\bweekdays\b|\bevery\s+weekday/.test(t)) return { type: 'weekdays' };
  if (/\bevery\s+week\b|weekly/.test(t))    return { type: 'weekly',   interval: 1 };
  if (/\bevery\s+month\b|monthly/.test(t))  return { type: 'monthly',  interval: 1 };

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const matches = [];
  for (let i = 0; i < dayNames.length; i++) {
    if (t.includes(dayNames[i])) matches.push(i);
  }
  if (matches.length) return { type: 'weekly', interval: 1, daysOfWeek: matches };

  return null;
};

// ── Private helpers ───────────────────────────────────────

const _addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const _isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const _daysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const _nextWeekDay = (from, daysOfWeek, weeksInterval) => {
  const sorted = [...daysOfWeek].sort((a, b) => a - b);
  const fromDay = from.getDay();

  // Find the next day-of-week after `from` in the same week
  for (const d of sorted) {
    if (d > fromDay) {
      const next = new Date(from);
      next.setDate(next.getDate() + (d - fromDay));
      return next;
    }
  }

  // Wrap to next week(s)
  const daysUntilFirstInCycle = 7 * weeksInterval - fromDay + sorted[0];
  return _addDays(from, daysUntilFirstInCycle);
};
