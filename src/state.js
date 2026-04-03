/**
 * @module state
 * @description SAM State function — derives control state from the model.
 * Uses sam-fsm for the task lifecycle FSM.
 * The global control state (view, panels, overlays) is a plain derivation.
 */

/**
 * Task lifecycle FSM definition.
 * Encodes legal transitions for the acceptors to validate against.
 */
export const TASK_FSM = {
  states: ['seed', 'active', 'blocked', 'snoozed', 'done', 'archived'],
  transitions: {
    seed:     ['active'],
    active:   ['done', 'blocked', 'snoozed', 'archived'],
    blocked:  ['active', 'archived'],
    snoozed:  ['active'],
    done:     [],   // terminal
    archived: [],   // terminal
  },
};

/**
 * Returns true if transitioning from `from` to `to` is a legal FSM move.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export const canTransition = (from, to) => {
  return TASK_FSM.transitions[from]?.includes(to) ?? false;
};

/**
 * Derives the global control state from the current model snapshot.
 * This determines which views and panels are active.
 *
 * @param {Object} model
 * @returns {Object} controlState
 */
export const deriveControlState = (model) => ({
  view:                 model.ui.view,
  taskEditorOpen:       model.ui.openTaskId !== null,
  openTaskId:           model.ui.openTaskId,
  selectedTaskIds:      model.ui.selectedTaskIds ?? [],
  captureBarOpen:       model.ui.captureBarOpen,
  commandPaletteOpen:   model.ui.commandPaletteOpen,
  focusModeActive:      model.ui.focusMode,
  focusTaskId:          model.ui.focusTaskId,
  voiceActive:          model.ui.voiceActive ?? false,
  toasts:               model.ui.toasts ?? [],
  streak:               model.streak,
  canUndo:              (model._undoStack?.length ?? 0) > 0,
});
