/**
 * @module status-bar-renderer
 * @description Updates the bottom status bar.
 */

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateStatusBar = (model, cs) => {
  const countEl = document.getElementById('status-task-count');
  const msgEl   = document.getElementById('status-message');

  if (countEl) {
    const active = model.tasks.filter(t => t.status === 'active').length;
    const seed   = model.tasks.filter(t => t.status === 'seed').length;
    const total  = model.tasks.length;
    countEl.textContent = `${active} active · ${seed} seed · ${total} total`;
  }

  if (msgEl) {
    const hints = cs.view === 'canvas'
      ? 'Double-click canvas to add task · N new task · K command palette'
      : '';
    msgEl.textContent = hints;
  }
};
