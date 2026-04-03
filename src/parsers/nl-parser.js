/**
 * @module nl-parser
 * @description Natural language quick-capture parser.
 * Converts a free-text task input into a partial Task object.
 *
 * Pipeline:
 *   rawInput → tokenize → extractDates → extractProject → extractEnergy
 *            → extractUrgency → extractRecurrence → buildTitle
 */

import * as chrono from 'chrono-node';
import { parseRecurrence } from '../core/recurrence.js';

/**
 * Parses a raw quick-capture string into a partial Task proposal.
 *
 * @param {string} rawInput
 * @param {Date}   [refDate=new Date()] - Reference date for relative date parsing
 * @returns {Object} Partial task object
 */
export const parseQuickCapture = (rawInput, refDate = new Date()) => {
  if (!rawInput?.trim()) return {};

  let remaining = rawInput.trim();
  const extracted = {};

  remaining = _extractProject(remaining, extracted);
  remaining = _extractEnergy(remaining, extracted);
  remaining = _extractUrgency(remaining, extracted);
  remaining = _extractRecurrence(remaining, extracted);
  remaining = _extractDates(remaining, extracted, refDate);

  extracted.title = _buildTitle(remaining);
  return extracted;
};

// ── Extractors ────────────────────────────────────────────

/**
 * Extracts #project-name tokens.
 * @param {string} text
 * @param {Object} out - Accumulator object
 * @returns {string} Remaining text
 */
const _extractProject = (text, out) => {
  const match = text.match(/#([\w-]+)/);
  if (match) {
    out.projectSlug = match[1];
    return text.replace(match[0], '').trim();
  }
  return text;
};

/**
 * Extracts @energy tokens: @high @medium @low
 * @param {string} text
 * @param {Object} out
 * @returns {string}
 */
const _extractEnergy = (text, out) => {
  const match = text.match(/@(high|medium|low)\b/i);
  if (match) {
    out.energy = match[1].toLowerCase();
    return text.replace(match[0], '').trim();
  }
  out.energy = 'medium';
  return text;
};

/**
 * Extracts !urgent flag.
 * @param {string} text
 * @param {Object} out
 * @returns {string}
 */
const _extractUrgency = (text, out) => {
  if (/!urgent\b/i.test(text)) {
    out.forceUrgent = true;
    return text.replace(/!urgent\b/i, '').trim();
  }
  return text;
};

/**
 * Extracts recurrence patterns ("every Monday", "daily", etc.)
 * @param {string} text
 * @param {Object} out
 * @returns {string}
 */
const _extractRecurrence = (text, out) => {
  const patterns = [
    /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(\s+and\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))*/i,
    /\b(daily|weekly|monthly|weekdays|every\s+day|every\s+week|every\s+month)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const rule = parseRecurrence(match[0]);
      if (rule) {
        out.recurrence = rule;
        return text.replace(match[0], '').trim();
      }
    }
  }
  return text;
};

/**
 * Extracts natural language dates via chrono-node.
 * @param {string} text
 * @param {Object} out
 * @param {Date}   refDate
 * @returns {string}
 */
const _extractDates = (text, out, refDate) => {
  const results = chrono.parse(text, refDate, { forwardDate: true });
  if (!results.length) return text;

  // Use the first date result as the deadline
  const result = results[0];
  out.deadline = result.date().toISOString();

  // Remove the matched date text from the remaining string
  const before = text.slice(0, result.index);
  const after  = text.slice(result.index + result.text.length);
  return (before + ' ' + after).trim();
};

/**
 * Cleans up the remaining token string into a task title.
 * @param {string} text
 * @returns {string}
 */
const _buildTitle = (text) => {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,;:.]+|[,;:.]+$/g, '')
    .trim();
};
