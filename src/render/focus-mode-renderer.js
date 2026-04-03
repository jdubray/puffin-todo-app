/**
 * @module focus-mode-renderer
 * @description Renders the focus mode overlay with task title and Pomodoro timer.
 */

import { html } from '../utils/safe-html.js';
import { FOCUS_DEFAULT_MINUTES } from '../core/constants.js';

let _timerInterval = null;
let _secondsLeft   = FOCUS_DEFAULT_MINUTES * 60;
let _running       = false;

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateFocusMode = (model, cs) => {
  const overlay = document.getElementById('focus-overlay');
  if (!overlay) return;

  const isOpen = cs.focusModeActive;
  overlay.classList.toggle('open', isOpen);
  overlay.hidden = !isOpen;
  overlay.setAttribute('aria-hidden', String(!isOpen));

  if (!isOpen) {
    _stopTimer();
    overlay.innerHTML = '';
    return;
  }

  const task = cs.focusTaskId
    ? model.tasks.find(t => t.id === cs.focusTaskId)
    : null;

  overlay.innerHTML = _renderFocusMode(task);
  _secondsLeft = FOCUS_DEFAULT_MINUTES * 60;
  _running = false;
  _attachListeners(overlay, task?.id);
};

// ── Private ───────────────────────────────────────────────

const _renderFocusMode = (task) => `
  <div class="focus-container">
    <div class="focus-task-title">${html`${task?.title ?? 'Focus session'}`}</div>
    <div class="focus-timer" id="focus-timer" aria-live="off">${_formatTime(FOCUS_DEFAULT_MINUTES * 60)}</div>
    <div style="display:flex;gap:var(--spacing-md)">
      <button class="btn btn-primary" id="focus-toggle" aria-label="Start timer">Start</button>
      <button class="btn btn-ghost"   id="focus-reset"  aria-label="Reset timer">Reset</button>
      ${task ? `<button class="btn btn-ghost" id="focus-complete" aria-label="Complete task">✓ Done</button>` : ''}
    </div>
    <button class="btn btn-ghost" id="focus-exit" aria-label="Exit focus mode" style="margin-top:var(--spacing-xl)">Exit focus mode</button>
  </div>
`;

const _attachListeners = (overlay, taskId) => {
  const dispatch = window.__dispatch;

  overlay.querySelector('#focus-toggle')?.addEventListener('click', (e) => {
    _running = !_running;
    e.target.textContent = _running ? 'Pause' : 'Resume';
    if (_running) _startTimer(overlay);
    else _stopTimer();
  });

  overlay.querySelector('#focus-reset')?.addEventListener('click', () => {
    _stopTimer();
    _running = false;
    _secondsLeft = FOCUS_DEFAULT_MINUTES * 60;
    _updateTimerDisplay(overlay);
    overlay.querySelector('#focus-toggle').textContent = 'Start';
  });

  overlay.querySelector('#focus-complete')?.addEventListener('click', () => {
    if (taskId) dispatch({ type: 'TASK_COMPLETE', taskId, completedAt: new Date().toISOString() });
    dispatch({ type: 'FOCUS_MODE_EXIT' });
  });

  overlay.querySelector('#focus-exit')?.addEventListener('click', () => {
    dispatch({ type: 'FOCUS_MODE_EXIT' });
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dispatch({ type: 'FOCUS_MODE_EXIT' });
  });
};

const _startTimer = (overlay) => {
  _timerInterval = setInterval(() => {
    if (_secondsLeft <= 0) {
      _stopTimer();
      _running = false;
      _notifyTimerEnd();
      return;
    }
    _secondsLeft--;
    _updateTimerDisplay(overlay);
  }, 1000);
};

const _stopTimer = () => {
  clearInterval(_timerInterval);
  _timerInterval = null;
};

const _updateTimerDisplay = (overlay) => {
  const el = overlay.querySelector('#focus-timer');
  if (el) el.textContent = _formatTime(_secondsLeft);
};

const _formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const _notifyTimerEnd = () => {
  window.__dispatch?.({ type: 'TOAST_SHOW', message: 'Focus session complete! Take a break.', variant: 'success' });
  // Browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification('Pulse', { body: 'Focus session complete! 🎉', icon: '/icons/icon-192.png' });
  }
};
