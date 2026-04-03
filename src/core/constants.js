/**
 * @module constants
 * @description Application-wide constants.
 */

/** Canvas zoom bounds */
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3.0;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_STEP = 0.1;

/** Undo stack size */
export const MAX_UNDO = 50;

/** Task default position on canvas when created by double-click */
export const DEFAULT_CARD_POSITION = { x: 100, y: 100 };

/** Snooze duration presets (minutes) */
export const SNOOZE_OPTIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour',     minutes: 60 },
  { label: '2 hours',    minutes: 120 },
  { label: 'This evening', minutes: null, targetHour: 18 },
  { label: 'Tomorrow morning', minutes: null, targetHour: 9, daysAhead: 1 },
  { label: 'Next week',  minutes: null, daysAhead: 7 },
];

/** Energy levels */
export const ENERGY_LEVELS = ['low', 'medium', 'high'];

/** Task status FSM states */
export const TASK_STATUSES = ['seed', 'active', 'blocked', 'snoozed', 'done', 'archived'];

/** Terminal states (move to Memory Vault) */
export const TERMINAL_STATUSES = ['done', 'archived'];

/** Urgency brackets */
export const URGENCY_LEVELS = {
  NONE:     { min: 0,  max: 24,  label: 'none',     class: '' },
  MEDIUM:   { min: 25, max: 49,  label: 'medium',   class: 'medium' },
  HIGH:     { min: 50, max: 74,  label: 'high',      class: 'high' },
  CRITICAL: { min: 75, max: 100, label: 'critical',  class: 'critical' },
};

/** Gmail poll interval (seconds) */
export const GMAIL_POLL_INTERVAL_S = 300;

/** Search debounce (ms) */
export const SEARCH_DEBOUNCE_MS = 150;

/** Focus mode default timer (minutes) */
export const FOCUS_DEFAULT_MINUTES = 25;

/** localStorage keys */
export const LS_KEYS = {
  SETTINGS:        'pulse_settings',
  CANVAS_STATE:    'pulse_canvasState',
  LAST_FLASHBACK:  'pulse_lastFlashback',
  STREAK:          'pulse_streakState',
  MOMENTUM_CACHE:  'pulse_momentumCache',
  GMAIL_TOKEN:     'pulse_gmailToken',
};
