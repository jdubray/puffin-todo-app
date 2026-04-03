/**
 * @module echo-matcher
 * @description Finds past memories (completed tasks) similar to a new task title.
 * Used to surface "echoes" — tasks the user has done before.
 */

import { fuzzyScore } from '../utils/fuzzy-match.js';

const ECHO_THRESHOLD = 30;
const MAX_ECHOES = 3;

/**
 * Finds memories whose title is similar to the given title.
 *
 * @param {string}   title    - Title of the new or edited task
 * @param {Object[]} memories - Array of memory objects (completed tasks)
 * @returns {Object[]} Up to MAX_ECHOES matching memories, sorted by score
 */
export const findEchoes = (title, memories) => {
  if (!title || !memories?.length) return [];

  return memories
    .map(m => ({ memory: m, score: fuzzyScore(title, m.title) }))
    .filter(({ score }) => score >= ECHO_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ECHOES)
    .map(({ memory }) => memory);
};
