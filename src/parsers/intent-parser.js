/**
 * @module intent-parser
 * @description Pure function that maps a voice transcript to a typed VoiceIntent.
 */

/**
 * @typedef {Object} VoiceIntent
 * @property {string} type       - Intent type constant
 * @property {Object} [payload]  - Intent-specific data
 */

const INTENT_PATTERNS = [
  { re: /^(add|create|new|make)\s+(.+)/i,           type: 'CREATE_TASK',     group: 2 },
  { re: /^note\s+on\s+(.+?):\s*(.+)/i,             type: 'ADD_NOTE',        groups: [1, 2] },
  { re: /^(complete|done\s+with|finish|finished)\s+(.+)/i, type: 'COMPLETE_TASK', group: 2 },
  { re: /^snooze\s+(.+?)\s+until\s+(.+)/i,         type: 'SNOOZE_TASK',     groups: [1, 2] },
  { re: /^(block|blocked)\s+(.+)/i,                type: 'BLOCK_TASK',      group: 2 },
  { re: /^open\s+(.+)/i,                           type: 'OPEN_TASK',       group: 1 },
  { re: /^(what('?s| is)\s+(on\s+)?(my\s+)?(todo|list|today))/i, type: 'QUERY_TODAY' },
  { re: /^(what('?s| is)\s+(my\s+)?(momentum|score))/i,          type: 'QUERY_MOMENTUM' },
  { re: /^(stop|exit|close|cancel)/i,              type: 'CANCEL' },
];

const JOURNAL_MIN_SENTENCES = 3;

/**
 * Parses a voice transcript into a VoiceIntent.
 *
 * @param {string} transcript - Raw speech-to-text output
 * @returns {VoiceIntent}
 */
export const parseIntent = (transcript) => {
  const text = transcript?.trim() ?? '';
  if (!text) return { type: 'EMPTY' };

  for (const { re, type, group, groups } of INTENT_PATTERNS) {
    const match = text.match(re);
    if (!match) continue;

    if (groups) {
      return { type, payload: { first: match[groups[0]], second: match[groups[1]] } };
    }
    if (group !== undefined) {
      return { type, payload: { text: match[group] } };
    }
    return { type };
  }

  // Journal fallback: long free-form speech
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
  if (sentenceCount >= JOURNAL_MIN_SENTENCES) {
    return { type: 'JOURNAL', payload: { transcript: text } };
  }

  return { type: 'UNKNOWN', payload: { transcript: text } };
};
