/**
 * @module task-actions
 * @description Pure proposal-building functions for task operations.
 * Actions have NO side effects — they only return a proposal object.
 */

import { parseQuickCapture } from '../parsers/nl-parser.js';
import { generateId } from '../utils/uuid.js';
import { todayISO } from '../utils/dates.js';

/**
 * Creates a TASK_CREATE proposal from raw quick-capture input.
 * @param {string} rawInput
 * @param {{ x: number, y: number }} [position] - Canvas position for the new card
 * @returns {Object}
 */
export const createTask = (rawInput, position) => ({
  type: 'TASK_CREATE',
  task: {
    id: generateId(),
    ...parseQuickCapture(rawInput),
    status: 'seed',
    position: position ?? { x: 120, y: 120 },
    createdAt: todayISO(),
    updatedAt: todayISO(),
    tags: [],
    body: '',
  },
});

/**
 * Creates a TASK_UPDATE proposal.
 * @param {string} taskId
 * @param {Object} changes - Partial task fields to update
 * @returns {Object}
 */
export const updateTask = (taskId, changes) => ({
  type: 'TASK_UPDATE',
  taskId,
  changes: { ...changes, updatedAt: todayISO() },
});

/**
 * Creates a TASK_COMPLETE proposal.
 * @param {string} taskId
 * @returns {Object}
 */
export const completeTask = (taskId) => ({
  type: 'TASK_COMPLETE',
  taskId,
  completedAt: todayISO(),
});

/**
 * Creates a TASK_ARCHIVE proposal.
 * @param {string} taskId
 * @returns {Object}
 */
export const archiveTask = (taskId) => ({
  type: 'TASK_ARCHIVE',
  taskId,
  archivedAt: todayISO(),
});

/**
 * Creates a TASK_SNOOZE proposal.
 * @param {string} taskId
 * @param {string} snoozedUntil - ISO 8601 datetime string
 * @returns {Object}
 */
export const snoozeTask = (taskId, snoozedUntil) => ({
  type: 'TASK_SNOOZE',
  taskId,
  snoozedUntil,
});

/**
 * Creates a TASK_WAKE proposal (un-snooze).
 * @param {string} taskId
 * @returns {Object}
 */
export const wakeTask = (taskId) => ({
  type: 'TASK_WAKE',
  taskId,
});

/**
 * Creates a TASK_BLOCK proposal.
 * @param {string} taskId
 * @param {string} [reason]
 * @returns {Object}
 */
export const blockTask = (taskId, reason) => ({
  type: 'TASK_BLOCK',
  taskId,
  reason,
});

/**
 * Creates a TASK_UNBLOCK proposal.
 * @param {string} taskId
 * @returns {Object}
 */
export const unblockTask = (taskId) => ({
  type: 'TASK_UNBLOCK',
  taskId,
});

/**
 * Creates a TASK_DELETE proposal.
 * @param {string} taskId
 * @returns {Object}
 */
export const deleteTask = (taskId) => ({
  type: 'TASK_DELETE',
  taskId,
});

/**
 * Creates a TASK_SELECT proposal (single select or add to selection).
 * @param {string|null} taskId - null to deselect all
 * @param {boolean} [additive=false]
 * @returns {Object}
 */
export const selectTask = (taskId, additive = false) => ({
  type: 'TASK_SELECT',
  taskId,
  additive,
});
