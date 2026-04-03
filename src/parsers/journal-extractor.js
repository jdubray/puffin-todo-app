/**
 * @module journal-extractor
 * @description Extracts candidate tasks from a free-form journal voice transcript.
 */

import { parseQuickCapture } from './nl-parser.js';

// Simple heuristics: sentences starting with action verbs or "I need to / I should"
const ACTION_PREFIXES = [
  /^I\s+(need|want|have|should|must|plan|intend)\s+to\s+/i,
  /^(fix|update|review|write|create|build|send|call|schedule|prepare|finish|complete|check)\s+/i,
  /^(remember\s+to|don'?t\s+forget\s+to)\s+/i,
];

/**
 * Splits a journal transcript into sentences and extracts candidate task strings.
 *
 * @param {string} transcript
 * @returns {Object[]} Array of partial task objects (from parseQuickCapture)
 */
export const extractTasksFromJournal = (transcript) => {
  if (!transcript?.trim()) return [];

  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  return sentences
    .filter(sentence => ACTION_PREFIXES.some(re => re.test(sentence)))
    .map(sentence => {
      // Strip leading action phrases
      const cleaned = sentence
        .replace(/^I\s+(need|want|have|should|must|plan|intend)\s+to\s+/i, '')
        .replace(/^(remember\s+to|don'?t\s+forget\s+to)\s+/i, '')
        .trim();
      return parseQuickCapture(cleaned);
    })
    .filter(task => task.title?.length > 0);
};
