/**
 * @module voice-actions
 * @description Pure proposal-building functions for voice-driven operations.
 */

import { parseIntent } from '../parsers/intent-parser.js';
import { createTask, completeTask, snoozeTask } from './task-actions.js';
import { fuzzyScore } from '../utils/fuzzy-match.js';

/**
 * Creates a VOICE_START proposal.
 * @returns {Object}
 */
export const startVoice = () => ({ type: 'VOICE_START' });

/**
 * Creates a VOICE_STOP proposal.
 * @returns {Object}
 */
export const stopVoice = () => ({ type: 'VOICE_STOP' });

/**
 * Dispatches the correct proposal for a completed voice transcript.
 * Returns an array of proposals (most intents yield one, JOURNAL may yield many).
 *
 * @param {string} transcript - Final transcript from SpeechRecognition
 * @param {Object} model      - Current model snapshot (needed for task lookup)
 * @returns {Object[]} Array of proposal objects
 */
export const handleVoiceTranscript = (transcript, model) => {
  const intent = parseIntent(transcript);

  switch (intent.type) {
    case 'CREATE_TASK':
      return [createTask(intent.payload.text)];

    case 'COMPLETE_TASK': {
      const task = _findTaskByTitle(intent.payload.text, model.tasks);
      if (!task) return [{ type: 'VOICE_TASK_NOT_FOUND', query: intent.payload.text }];
      return [completeTask(task.id)];
    }

    case 'SNOOZE_TASK': {
      const task = _findTaskByTitle(intent.payload.first, model.tasks);
      if (!task) return [{ type: 'VOICE_TASK_NOT_FOUND', query: intent.payload.first }];
      return [snoozeTask(task.id, intent.payload.second)];
    }

    case 'QUERY_TODAY':
      return [{ type: 'VOICE_QUERY_TODAY' }];

    case 'QUERY_MOMENTUM':
      return [{ type: 'VOICE_QUERY_MOMENTUM' }];

    case 'CANCEL':
      return [stopVoice()];

    default:
      return [{ type: 'VOICE_UNKNOWN', transcript }];
  }
};

// ── Private helpers ───────────────────────────────────────

const _findTaskByTitle = (query, tasks) => {
  if (!tasks?.length) return null;
  let best = null;
  let bestScore = 0;
  for (const t of tasks) {
    const score = fuzzyScore(query, t.title);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore > 0 ? best : null;
};
