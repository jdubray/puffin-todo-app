/**
 * @module urgency
 * @description Computes a task's urgency score (0–100).
 * This is a pure function — urgency is never stored, always derived.
 */

import { URGENCY_LEVELS } from './constants.js';

const HOUR  = 1000 * 60 * 60;
const DAY   = 24 * HOUR;

/**
 * Computes the urgency score for a task.
 *
 * Factors:
 *  - Deadline proximity (dominant factor)
 *  - Energy level (affects the weight of proximity)
 *  - Whether task is blocked (caps at 30)
 *  - Whether deadline has passed (forces maximum)
 *
 * @param {Object} task
 * @param {string|null}  task.deadline   - ISO date string or null
 * @param {string}       task.energy     - 'low' | 'medium' | 'high'
 * @param {string}       task.status     - task status string
 * @param {Date}         [now=new Date()]
 * @returns {number} Integer 0–100
 */
export const computeUrgency = (task, now = new Date()) => {
  if (!task) return 0;
  if (task.status === 'done' || task.status === 'archived') return 0;

  // Blocked tasks get low urgency (they can't be acted on)
  if (task.status === 'blocked') return Math.min(30, _deadlineScore(task.deadline, now));

  if (!task.deadline) return _energyBaseline(task.energy);

  const score = _deadlineScore(task.deadline, now);
  const energyMultiplier = _energyMultiplier(task.energy);

  return Math.round(Math.min(100, score * energyMultiplier));
};

/**
 * Maps an urgency score to a level label.
 * @param {number} score
 * @returns {'none'|'medium'|'high'|'critical'}
 */
export const urgencyLevel = (score) => {
  for (const level of Object.values(URGENCY_LEVELS)) {
    if (score >= level.min && score <= level.max) return level.label;
  }
  return 'none';
};

// ── Private helpers ───────────────────────────────────────

const _deadlineScore = (deadline, now) => {
  if (!deadline) return 0;
  const deadlineMs = new Date(deadline).getTime();
  const nowMs = now.getTime();
  const msUntil = deadlineMs - nowMs;

  if (msUntil <= 0)         return 100;  // overdue
  if (msUntil <= 2  * HOUR) return 95;
  if (msUntil <= 6  * HOUR) return 85;
  if (msUntil <= DAY)       return 70;
  if (msUntil <= 2  * DAY)  return 55;
  if (msUntil <= 3  * DAY)  return 40;
  if (msUntil <= 7  * DAY)  return 25;
  if (msUntil <= 14 * DAY)  return 12;
  return 5;
};

const _energyMultiplier = (energy) => {
  switch (energy) {
    case 'high':   return 1.2;
    case 'medium': return 1.0;
    case 'low':    return 0.85;
    default:       return 1.0;
  }
};

const _energyBaseline = (energy) => {
  switch (energy) {
    case 'high':   return 20;
    case 'medium': return 10;
    case 'low':    return 5;
    default:       return 5;
  }
};
