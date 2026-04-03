/**
 * @module pulse-db
 * @description Dexie (IndexedDB) instance and store definitions for Pulse.
 */

import Dexie from 'dexie';

export const db = new Dexie('pulse');

db.version(1).stores({
  tasks:       'id, status, projectId, deadline, updatedAt, [status+projectId]',
  memories:    'id, completedAt, projectId, *tags',
  projects:    'id',
  voiceNotes:  'id, taskId',
  audioBlobs:  'id',
  patterns:    'id, patternType, userAction',
  undoHistory: '++seq',
});

/**
 * Ensures all object stores are populated. Called during app init.
 * @returns {Promise<void>}
 */
export const openDb = () => db.open();
