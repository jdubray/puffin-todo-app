/**
 * @module nap
 * @description Next Action Predicates — automatic actions triggered after each model mutation.
 */

import { wakeTask } from './actions/task-actions.js';
import { GMAIL_POLL_INTERVAL_S, LS_KEYS } from './core/constants.js';

/** Reference to the SAM dispatch function, injected at boot */
let _dispatch = null;

/**
 * Injects the dispatch function so NAP can trigger proposals.
 * @param {Function} dispatch
 */
export const initNap = (dispatch) => { _dispatch = dispatch; };

/**
 * Checked after every model mutation.
 * @param {Object} model
 */
export const nap = (model) => {
  if (!_dispatch) return;
  const now = Date.now();

  // Wake snoozed tasks whose time has come
  model.tasks
    .filter(t => t.status === 'snoozed' && t.snoozedUntil && new Date(t.snoozedUntil).getTime() <= now)
    .forEach(t => _dispatch(wakeTask(t.id)));

  // Gmail poll
  if (model._gmailNextPoll && model._gmailNextPoll <= now) {
    model._gmailNextPoll = now + GMAIL_POLL_INTERVAL_S * 1000;
    _dispatch({ type: 'GMAIL_POLL' });
  }

  // First open today — check for flashback
  _checkFlashback(model);
};

// ── Private ───────────────────────────────────────────────

const _checkFlashback = (model) => {
  if (!_dispatch) return;
  try {
    const last = localStorage.getItem(LS_KEYS.LAST_FLASHBACK);
    const today = new Date().toDateString();
    if (last === today) return;

    localStorage.setItem(LS_KEYS.LAST_FLASHBACK, today);
    _dispatch({ type: 'FLASHBACK_CHECK' });
  } catch { /* non-fatal */ }
};
