/**
 * @module export-service
 * @description JSON export and import for tasks and memories.
 */

import { db } from '../db/pulse-db.js';

/**
 * Exports all data to a downloadable JSON file.
 * @returns {Promise<void>}
 */
export const exportData = async () => {
  const [tasks, memories, projects] = await Promise.all([
    db.tasks.toArray(),
    db.memories.toArray(),
    db.projects.toArray(),
  ]);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    memories,
    projects,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pulse-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Imports data from a JSON file (merges with existing data).
 * @param {File} file
 * @returns {Promise<{ imported: number, errors: number }>}
 */
export const importData = async (file) => {
  const text = await file.text();
  const payload = JSON.parse(text);

  if (!payload.version || !Array.isArray(payload.tasks)) {
    throw new Error('Invalid Pulse export file');
  }

  let imported = 0;
  let errors   = 0;

  await db.transaction('rw', db.tasks, db.memories, db.projects, async () => {
    for (const task of payload.tasks ?? []) {
      try { await db.tasks.put(task); imported++; }
      catch { errors++; }
    }
    for (const memory of payload.memories ?? []) {
      try { await db.memories.put(memory); imported++; }
      catch { errors++; }
    }
    for (const project of payload.projects ?? []) {
      try { await db.projects.put(project); imported++; }
      catch { errors++; }
    }
  });

  return { imported, errors };
};
