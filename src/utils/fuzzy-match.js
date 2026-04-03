/**
 * @module fuzzy-match
 * @description Simple fuzzy string scoring for command palette and search.
 */

/**
 * Computes a fuzzy match score between a query and a target string.
 * Returns 0 if no match, higher values for better matches.
 *
 * @param {string} query  - The search query (what the user typed)
 * @param {string} target - The string to match against
 * @returns {number} Score >= 0; 0 means no match
 */
export const fuzzyScore = (query, target) => {
  if (!query) return 1;

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 1000;
  if (t.startsWith(q)) return 900;
  if (t.includes(q)) return 800;

  // Character-by-character sequential match
  let score = 0;
  let qi = 0;
  let consecutiveBonus = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5;
      qi++;
    } else {
      consecutiveBonus = 0;
    }
  }

  // All query characters must be matched
  if (qi < q.length) return 0;

  // Penalise for target length (prefer shorter strings)
  score -= t.length * 0.5;

  return Math.max(score, 1);
};

/**
 * Filters and sorts a list of items by fuzzy match score.
 *
 * @template T
 * @param {string} query
 * @param {T[]} items
 * @param {(item: T) => string} getKey - Extracts the string to match from each item
 * @returns {T[]} Sorted by descending score, with non-matching items removed
 */
export const fuzzyFilter = (query, items, getKey) => {
  if (!query) return items;

  return items
    .map(item => ({ item, score: fuzzyScore(query, getKey(item)) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};
