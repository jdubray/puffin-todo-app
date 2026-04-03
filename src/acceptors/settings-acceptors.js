/**
 * @module settings-acceptors
 * @description Acceptors for settings proposals.
 */

import { LS_KEYS } from '../core/constants.js';

const DEFAULTS = {
  theme: 'dark',
  voiceEnabled: true,
  focusDefaultMinutes: 25,
  gmailLabelFilter: 'pulse',
  showMinimap: true,
  reduceMotion: false,
  language: 'en',
};

/**
 * @param {Object} model
 * @param {{ type: 'SETTINGS_UPDATE', changes: Object }} proposal
 */
export const onSettingsUpdate = (model, proposal) => {
  model.settings = { ...model.settings, ...proposal.changes };
  _persist(model.settings);
};

/**
 * @param {Object} model
 */
export const onSettingsReset = (model) => {
  model.settings = { ...DEFAULTS };
  _persist(model.settings);
};

/**
 * Loads persisted settings from localStorage into the model.
 * Called during app hydration (not a proposal — called directly).
 * @param {Object} model
 */
export const hydrateSettings = (model) => {
  try {
    const raw = localStorage.getItem(LS_KEYS.SETTINGS);
    model.settings = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    model.settings = { ...DEFAULTS };
  }
};

const _persist = (settings) => {
  try {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
  } catch { /* non-fatal */ }
};
