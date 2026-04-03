/**
 * @module calendar-service
 * @description Builds Google Calendar "Add event" URLs for tasks with deadlines.
 * No OAuth required — uses the public URL scheme.
 */

/**
 * Builds a Google Calendar "create event" URL for a task.
 * @param {Object} task
 * @param {string} task.title
 * @param {string} [task.deadline]
 * @param {string} [task.body]
 * @returns {string} URL to open in a new tab
 */
export const buildCalendarUrl = (task) => {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text:    task.title,
    details: task.body ?? '',
  });

  if (task.deadline) {
    const d = new Date(task.deadline);
    // GCal date format: YYYYMMDDTHHMMSS
    const fmt = (date) => date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const end = new Date(d.getTime() + 60 * 60_000); // 1 hour duration
    params.set('dates', `${fmt(d)}/${fmt(end)}`);
  }

  // Validate scheme before opening (security: block javascript:, data:)
  const url = `${base}&${params.toString()}`;
  return url.startsWith('https://') ? url : '';
};

/**
 * Opens the Google Calendar event creation page for a task.
 * @param {Object} task
 */
export const openInCalendar = (task) => {
  const url = buildCalendarUrl(task);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};
