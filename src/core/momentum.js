/**
 * @module momentum
 * @description Computes the user's productivity momentum score (0–100).
 * Momentum reflects recent completion rate relative to the task load.
 */

import { LS_KEYS } from './constants.js';

const CACHE_TTL_MS = 60 * 1000; // recompute at most once per minute

/**
 * Computes the current momentum score.
 *
 * Algorithm:
 *  - Tasks completed in the last 24 h weighted x3
 *  - Tasks completed in the last 7 d weighted x1
 *  - Normalised against current active task count (load factor)
 *  - Score clamped to 0–100
 *
 * @param {Object} model
 * @param {Object[]} model.tasks     - Active tasks
 * @param {Object[]} [recentMemories] - Completed/archived tasks from memory store
 * @param {Date}    [now=new Date()]
 * @returns {number} Integer 0–100
 */
export const computeMomentum = (model, recentMemories = [], now = new Date()) => {
  const nowMs = now.getTime();
  const DAY   = 24 * 60 * 60 * 1000;
  const WEEK  = 7 * DAY;

  const completedLast24h = recentMemories.filter(m =>
    nowMs - new Date(m.completedAt).getTime() <= DAY
  ).length;

  const completedLastWeek = recentMemories.filter(m => {
    const age = nowMs - new Date(m.completedAt).getTime();
    return age > DAY && age <= WEEK;
  }).length;

  const activeTasks = model.tasks.filter(t =>
    t.status === 'active' || t.status === 'seed'
  ).length;

  const rawScore = completedLast24h * 3 + completedLastWeek;
  const loadFactor = Math.max(1, activeTasks * 0.5);
  const normalised = rawScore / loadFactor;

  // Map normalised to 0–100 with soft cap
  const score = Math.round(Math.min(100, normalised * 20));
  return score;
};

/**
 * Returns a cached momentum score if fresh, otherwise null.
 * @returns {{ score: number, calculatedAt: string } | null}
 */
export const getCachedMomentum = () => {
  try {
    const raw = localStorage.getItem(LS_KEYS.MOMENTUM_CACHE);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - new Date(cached.calculatedAt).getTime() < CACHE_TTL_MS) {
      return cached;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Saves a momentum score to the cache.
 * @param {number} score
 */
export const cacheMomentum = (score) => {
  localStorage.setItem(
    LS_KEYS.MOMENTUM_CACHE,
    JSON.stringify({ score, calculatedAt: new Date().toISOString() })
  );
};
