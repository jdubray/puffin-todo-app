/**
 * @module task-editor-renderer
 * @description Renders the task detail/editor side panel.
 */

import { html, trusted } from '../utils/safe-html.js';
import { relativeTime, formatShortDate } from '../utils/dates.js';
import { SNOOZE_OPTIONS } from '../core/constants.js';

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateTaskEditor = (model, cs) => {
  const panel = document.getElementById('task-editor');
  if (!panel) return;

  const isOpen = cs.taskEditorOpen && cs.openTaskId;
  panel.classList.toggle('open', isOpen);
  panel.hidden = !isOpen;
  panel.setAttribute('aria-hidden', String(!isOpen));

  if (!isOpen) return;

  const task = model.tasks.find(t => t.id === cs.openTaskId);
  if (!task) {
    panel.innerHTML = '<p style="padding:1rem;color:var(--color-text-muted)">Task not found.</p>';
    return;
  }

  panel.innerHTML = _renderEditor(task, model.projects);
  _attachEditorListeners(panel, task);
};

// ── Private ───────────────────────────────────────────────

const _renderEditor = (task, projects) => {
  const project = projects.find(p => p.id === task.projectId);
  const deadlineDisplay = task.deadline
    ? `${formatShortDate(task.deadline)} (${relativeTime(task.deadline)})`
    : 'No deadline';

  const snoozeOptionsHtml = SNOOZE_OPTIONS
    .map(o => html`<button class="btn btn-ghost snooze-option" data-minutes="${o.minutes ?? ''}" data-days="${o.daysAhead ?? ''}" data-hour="${o.targetHour ?? ''}">${o.label}</button>`)
    .join('');

  const statusOptions = ['seed','active','blocked','snoozed','done','archived']
    .map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s}</option>`)
    .join('');

  return html`
    <div class="editor-header">
      <textarea class="editor-title" id="editor-title" rows="2" aria-label="Task title">${task.title}</textarea>
      <button class="icon-btn" id="editor-close" aria-label="Close editor">${trusted(_closeIcon())}</button>
    </div>
    <div class="editor-body">
      <div class="editor-field">
        <label for="editor-status">Status</label>
        <select id="editor-status" class="field-value" aria-label="Task status">
          ${trusted(statusOptions)}
        </select>
      </div>
      <div class="editor-field">
        <label for="editor-deadline">Deadline</label>
        <div class="field-value" id="editor-deadline-display">${deadlineDisplay}</div>
        <input type="datetime-local" id="editor-deadline" class="field-value" style="margin-top:var(--spacing-xs)"
               value="${task.deadline ? task.deadline.slice(0, 16) : ''}" aria-label="Set deadline"/>
      </div>
      <div class="editor-field">
        <label for="editor-energy">Energy</label>
        <select id="editor-energy" class="field-value" aria-label="Energy level">
          <option value="low"    ${task.energy === 'low'    ? 'selected' : ''}>🔋 Low</option>
          <option value="medium" ${task.energy === 'medium' ? 'selected' : ''}>⚡ Medium</option>
          <option value="high"   ${task.energy === 'high'   ? 'selected' : ''}>🔥 High</option>
        </select>
      </div>
      ${task.projectSlug ? trusted(html`
      <div class="editor-field">
        <label>Project</label>
        <div class="field-value">#${task.projectSlug}</div>
      </div>`) : ''}
      <div class="editor-field">
        <label for="editor-body">Notes</label>
        <textarea id="editor-body" class="field-value" rows="5" aria-label="Task notes">${task.body ?? ''}</textarea>
      </div>
      <div class="editor-field">
        <label>Snooze</label>
        <div class="snooze-options" style="display:flex;flex-wrap:wrap;gap:var(--spacing-xs)">
          ${trusted(snoozeOptionsHtml)}
        </div>
      </div>
      <div class="editor-field" style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
        <span>Created ${relativeTime(task.createdAt)}</span>
        ${task.updatedAt !== task.createdAt ? trusted(html` · Updated ${relativeTime(task.updatedAt)}`) : ''}
      </div>
    </div>
    <div class="editor-footer">
      <button class="btn btn-danger" id="editor-delete" aria-label="Delete task">Delete</button>
      <button class="btn btn-ghost" id="editor-archive" aria-label="Archive task">Archive</button>
      <button class="btn btn-primary" id="editor-save" aria-label="Save task">Save</button>
    </div>
  `;
};

const _attachEditorListeners = (panel, task) => {
  const dispatch = window.__dispatch;

  panel.querySelector('#editor-close')?.addEventListener('click', () => {
    dispatch({ type: 'PANEL_CLOSE' });
  });

  panel.querySelector('#editor-save')?.addEventListener('click', () => {
    const title    = panel.querySelector('#editor-title')?.value?.trim();
    const body     = panel.querySelector('#editor-body')?.value;
    const energy   = panel.querySelector('#editor-energy')?.value;
    const deadline = panel.querySelector('#editor-deadline')?.value;
    const status   = panel.querySelector('#editor-status')?.value;

    dispatch({ type: 'TASK_UPDATE', taskId: task.id, changes: {
      title:    title || task.title,
      body:     body ?? task.body,
      energy:   energy ?? task.energy,
      deadline: deadline ? new Date(deadline).toISOString() : task.deadline,
      status:   status ?? task.status,
    }});
    dispatch({ type: 'PANEL_CLOSE' });
  });

  panel.querySelector('#editor-delete')?.addEventListener('click', () => {
    if (confirm(`Delete "${task.title}"?`)) {
      dispatch({ type: 'TASK_DELETE', taskId: task.id });
      dispatch({ type: 'PANEL_CLOSE' });
    }
  });

  panel.querySelector('#editor-archive')?.addEventListener('click', () => {
    dispatch({ type: 'TASK_ARCHIVE', taskId: task.id, archivedAt: new Date().toISOString() });
    dispatch({ type: 'PANEL_CLOSE' });
  });

  panel.querySelectorAll('.snooze-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const until = _computeSnoozeUntil(btn);
      if (until) dispatch({ type: 'TASK_SNOOZE', taskId: task.id, snoozedUntil: until });
      dispatch({ type: 'PANEL_CLOSE' });
    });
  });

  // Keyboard: Escape closes editor
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dispatch({ type: 'PANEL_CLOSE' });
  });
};

const _computeSnoozeUntil = (btn) => {
  const minutes  = parseInt(btn.dataset.minutes, 10);
  const daysAhead= parseInt(btn.dataset.days,    10) || 0;
  const hour     = parseInt(btn.dataset.hour,    10);
  const now      = new Date();

  if (!isNaN(minutes) && btn.dataset.minutes !== '') {
    return new Date(now.getTime() + minutes * 60_000).toISOString();
  }
  if (daysAhead > 0) {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    if (!isNaN(hour)) d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }
  if (!isNaN(hour)) {
    const d = new Date(now);
    d.setHours(hour, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  return null;
};

const _closeIcon = () =>
  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
