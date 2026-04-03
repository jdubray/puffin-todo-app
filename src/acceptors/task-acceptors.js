/**
 * @module task-acceptors
 * @description Business rule handlers for task proposals.
 * Each acceptor mutates the model in-place and syncs to IndexedDB.
 */

import { db } from '../db/pulse-db.js';
import { computeUrgency } from '../core/urgency.js';
import { nextOccurrence } from '../core/recurrence.js';
import { generateId } from '../utils/uuid.js';
import { todayISO } from '../utils/dates.js';
import { MAX_UNDO, TERMINAL_STATUSES, LS_KEYS } from '../core/constants.js';

// ── Undo helpers ──────────────────────────────────────────

const pushUndo = (model, entry) => {
  model._undoStack = model._undoStack ?? [];
  model._undoStack.push(entry);
  if (model._undoStack.length > MAX_UNDO) model._undoStack.shift();
  db.undoHistory.put({ ...entry, seq: undefined }).catch(() => {});
};

// ── Acceptors ─────────────────────────────────────────────

/**
 * @param {Object} model
 * @param {{ type: 'TASK_CREATE', task: Object }} proposal
 */
export const onTaskCreate = async (model, proposal) => {
  const task = {
    ...proposal.task,
    urgency: computeUrgency(proposal.task),
  };
  model.tasks.push(task);
  await db.tasks.put(_stripComputedFields(task));
  pushUndo(model, { type: 'TASK_DELETE', taskId: task.id });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_UPDATE', taskId: string, changes: Object }} proposal
 */
export const onTaskUpdate = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task) return;

  const snapshot = { ...task };
  Object.assign(task, proposal.changes);
  task.urgency = computeUrgency(task);

  await db.tasks.put(_stripComputedFields(task));
  pushUndo(model, { type: 'RESTORE_TASK', snapshot });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_COMPLETE', taskId: string, completedAt: string }} proposal
 */
export const onTaskComplete = async (model, proposal) => {
  const idx = model.tasks.findIndex(t => t.id === proposal.taskId);
  if (idx === -1) return;

  const [task] = model.tasks.splice(idx, 1);
  const { urgency: _u, ...memory } = { // eslint-disable-line no-unused-vars
    ...task,
    status: 'done',
    completedAt: proposal.completedAt,
  };

  await db.tasks.delete(task.id);
  await db.memories.put(memory);

  // Update streak
  _updateStreak(model, proposal.completedAt);

  // Spawn recurrence
  if (task.recurrence) {
    const nextDate = nextOccurrence(task.recurrence, proposal.completedAt);
    const spawned = {
      ...task,
      id: generateId(),
      status: 'seed',
      deadline: nextDate.toISOString(),
      createdAt: todayISO(),
      updatedAt: todayISO(),
    };
    spawned.urgency = computeUrgency(spawned);
    model.tasks.push(spawned);
    await db.tasks.put(_stripComputedFields(spawned));
  }

  pushUndo(model, { type: 'RESTORE_TASK', snapshot: { ...task, status: 'active' } });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_ARCHIVE', taskId: string, archivedAt: string }} proposal
 */
export const onTaskArchive = async (model, proposal) => {
  const idx = model.tasks.findIndex(t => t.id === proposal.taskId);
  if (idx === -1) return;

  const [task] = model.tasks.splice(idx, 1);
  const { urgency: _u, ...memory } = { ...task, status: 'archived', completedAt: proposal.archivedAt }; // eslint-disable-line no-unused-vars

  await db.tasks.delete(task.id);
  await db.memories.put(memory);
  pushUndo(model, { type: 'RESTORE_TASK', snapshot: task });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_SNOOZE', taskId: string, snoozedUntil: string }} proposal
 */
export const onTaskSnooze = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task) return;
  if (!['active', 'seed'].includes(task.status)) return;

  const snapshot = { ...task };
  task.status = 'snoozed';
  task.snoozedUntil = proposal.snoozedUntil;
  task.updatedAt = todayISO();
  task.urgency = 0;

  await db.tasks.put(_stripComputedFields(task));
  pushUndo(model, { type: 'RESTORE_TASK', snapshot });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_WAKE', taskId: string }} proposal
 */
export const onTaskWake = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task || task.status !== 'snoozed') return;

  task.status = 'active';
  task.snoozedUntil = null;
  task.updatedAt = todayISO();
  task.urgency = computeUrgency(task);

  await db.tasks.put(_stripComputedFields(task));
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_BLOCK', taskId: string, reason?: string }} proposal
 */
export const onTaskBlock = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task || task.status === 'blocked') return;
  if (TERMINAL_STATUSES.includes(task.status)) return;

  const snapshot = { ...task };
  task.status = 'blocked';
  task.blockReason = proposal.reason ?? null;
  task.updatedAt = todayISO();
  task.urgency = computeUrgency(task);

  await db.tasks.put(_stripComputedFields(task));
  pushUndo(model, { type: 'RESTORE_TASK', snapshot });
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_UNBLOCK', taskId: string }} proposal
 */
export const onTaskUnblock = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task || task.status !== 'blocked') return;

  task.status = 'active';
  task.blockReason = null;
  task.updatedAt = todayISO();
  task.urgency = computeUrgency(task);

  await db.tasks.put(_stripComputedFields(task));
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_DELETE', taskId: string }} proposal
 */
export const onTaskDelete = async (model, proposal) => {
  const idx = model.tasks.findIndex(t => t.id === proposal.taskId);
  if (idx === -1) return;

  const [task] = model.tasks.splice(idx, 1);
  await db.tasks.delete(task.id);
};

/**
 * @param {Object} model
 * @param {{ type: 'TASK_SELECT', taskId: string|null, additive: boolean }} proposal
 */
export const onTaskSelect = (model, proposal) => {
  if (!proposal.additive) {
    model.ui.selectedTaskIds = proposal.taskId ? [proposal.taskId] : [];
  } else if (proposal.taskId) {
    const set = new Set(model.ui.selectedTaskIds ?? []);
    if (set.has(proposal.taskId)) set.delete(proposal.taskId);
    else set.add(proposal.taskId);
    model.ui.selectedTaskIds = [...set];
  }
  model.ui.openTaskId = proposal.taskId ?? null;
};

// ── Undo acceptor ─────────────────────────────────────────

/**
 * @param {Object} model
 */
export const onUndo = async (model) => {
  const entry = model._undoStack?.pop();
  if (!entry) return;

  if (entry.type === 'RESTORE_TASK') {
    const existing = model.tasks.find(t => t.id === entry.snapshot.id);
    if (existing) {
      Object.assign(existing, entry.snapshot);
      existing.urgency = computeUrgency(existing);
      await db.tasks.put(_stripComputedFields(existing));
    } else {
      const restored = { ...entry.snapshot, urgency: computeUrgency(entry.snapshot) };
      model.tasks.push(restored);
      await db.tasks.put(_stripComputedFields(restored));
    }
  }

  if (entry.type === 'TASK_DELETE') {
    const idx = model.tasks.findIndex(t => t.id === entry.taskId);
    if (idx !== -1) {
      model.tasks.splice(idx, 1);
      await db.tasks.delete(entry.taskId);
    }
  }
};

// ── Private helpers ───────────────────────────────────────

/** Strip computed (non-persistent) fields before writing to IDB */
const _stripComputedFields = (task) => {
  const { urgency, ...rest } = task; // eslint-disable-line no-unused-vars
  return rest;
};

const _updateStreak = (model, completedAt) => {
  const today = new Date(completedAt).toDateString();
  const last  = model.streak.lastCompletionDate;

  if (last === today) return; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === yesterday.toDateString()) {
    model.streak.count += 1;
  } else {
    model.streak.count = 1; // streak broken — restart
  }
  model.streak.lastCompletionDate = today;

  try {
    localStorage.setItem(LS_KEYS.STREAK, JSON.stringify(model.streak));
  } catch { /* non-fatal */ }
};
