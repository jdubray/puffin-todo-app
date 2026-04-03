/**
 * @module timeline-renderer
 * @description Renders the timeline view — tasks grouped by deadline date.
 */

import { html, trusted } from '../utils/safe-html.js';
import { formatShortDate, isOverdue, isDueSoon, isToday } from '../utils/dates.js';

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateTimeline = (model, cs) => {
  if (cs.view !== 'timeline') return;

  const container = document.getElementById('timeline-content');
  if (!container) return;

  const activeTasks = model.tasks.filter(t => !['done','archived'].includes(t.status));

  if (!activeTasks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No tasks scheduled</div>
        <div class="empty-state-hint">Add a deadline to a task to see it here.</div>
      </div>`;
    return;
  }

  const groups = _groupByDate(activeTasks);
  container.innerHTML = groups.map(_renderGroup).join('');
  _attachListeners(container);
};

// ── Private ───────────────────────────────────────────────

const _groupByDate = (tasks) => {
  const withDeadline = tasks.filter(t => t.deadline).sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );
  const withoutDeadline = tasks.filter(t => !t.deadline);

  const map = new Map();

  for (const t of withDeadline) {
    const key = new Date(t.deadline).toDateString();
    if (!map.has(key)) map.set(key, { date: new Date(t.deadline), tasks: [] });
    map.get(key).tasks.push(t);
  }

  const groups = [...map.values()];
  if (withoutDeadline.length) {
    groups.push({ date: null, tasks: withoutDeadline });
  }
  return groups;
};

const _renderGroup = ({ date, tasks }) => {
  const label = date
    ? (isToday(date) ? 'Today' : formatShortDate(date))
    : 'No deadline';

  const cls = date
    ? (isOverdue(date) ? 'overdue' : isDueSoon(date) ? 'due-soon' : '')
    : '';

  const taskRows = tasks.map(t => html`
    <div class="timeline-task" role="button" tabindex="0" data-task-id="${t.id}" aria-label="${t.title}">
      <span class="timeline-task-status" data-status="${t.status}"></span>
      <span class="timeline-task-title">${t.title}</span>
      ${t.projectSlug ? trusted(html`<span class="timeline-task-project">#${t.projectSlug}</span>`) : ''}
    </div>
  `).join('');

  return html`
    <div class="timeline-group">
      <div class="timeline-date ${cls}" role="heading" aria-level="3">${label}</div>
      <div class="timeline-tasks">${trusted(taskRows)}</div>
    </div>
  `;
};

const _attachListeners = (container) => {
  container.addEventListener('click', (e) => {
    const taskEl = e.target.closest('[data-task-id]');
    if (taskEl) window.__dispatch({ type: 'PANEL_OPEN', taskId: taskEl.dataset.taskId });
  });
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const taskEl = e.target.closest('[data-task-id]');
      if (taskEl) window.__dispatch({ type: 'PANEL_OPEN', taskId: taskEl.dataset.taskId });
    }
  });
};
