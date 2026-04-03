/**
 * @module toolbar-renderer
 * @description Updates the top toolbar DOM based on model/control state.
 */

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateToolbar = (model, cs) => {
  // Momentum display
  const momentumEl = document.getElementById('momentum-value');
  if (momentumEl && model._momentum !== undefined) {
    momentumEl.textContent = model._momentum;
  }

  // Streak display
  const streakEl = document.getElementById('streak-value');
  if (streakEl) {
    streakEl.textContent = String(cs.streak?.count ?? 0);
  }

  // Voice button pressed state
  const voiceBtn = document.getElementById('btn-voice');
  if (voiceBtn) {
    voiceBtn.setAttribute('aria-pressed', String(cs.voiceActive));
    voiceBtn.classList.toggle('recording', cs.voiceActive);
  }

  // Focus mode button pressed state
  const focusBtn = document.getElementById('btn-focus');
  if (focusBtn) {
    focusBtn.setAttribute('aria-pressed', String(cs.focusModeActive));
  }

  // Undo keyboard hint (title attr on toolbar)
  const toolbar = document.getElementById('toolbar');
  if (toolbar && cs.canUndo !== toolbar._lastCanUndo) {
    toolbar._lastCanUndo = cs.canUndo;
  }
};
