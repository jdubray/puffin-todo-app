/**
 * @module ui-acceptors
 * @description Acceptors for UI state proposals (panel open/close, view switch, etc.)
 */

/**
 * @param {Object} model
 * @param {{ type: 'PANEL_OPEN', taskId: string }} proposal
 */
export const onPanelOpen = (model, proposal) => {
  model.ui.openTaskId = proposal.taskId;
};

/**
 * @param {Object} model
 */
export const onPanelClose = (model) => {
  model.ui.openTaskId = null;
};

/**
 * @param {Object} model
 * @param {{ type: 'VIEW_SWITCH', view: string }} proposal
 */
export const onViewSwitch = (model, proposal) => {
  const validViews = ['canvas', 'timeline', 'memory'];
  if (!validViews.includes(proposal.view)) return;
  model.ui.view = proposal.view;
};

/**
 * @param {Object} model
 * @param {{ type: 'CAPTURE_OPEN', position?: { x: number, y: number } }} proposal
 */
export const onCaptureOpen = (model, proposal) => {
  model.ui.captureBarOpen = true;
  model.ui.capturePosition = proposal.position ?? null;
};

/**
 * @param {Object} model
 */
export const onCaptureClose = (model) => {
  model.ui.captureBarOpen = false;
  model.ui.capturePosition = null;
};

/**
 * @param {Object} model
 */
export const onCommandPaletteOpen = (model) => {
  model.ui.commandPaletteOpen = true;
};

/**
 * @param {Object} model
 */
export const onCommandPaletteClose = (model) => {
  model.ui.commandPaletteOpen = false;
};

/**
 * @param {Object} model
 */
export const onFocusModeEnter = (model, proposal) => {
  model.ui.focusMode = true;
  model.ui.focusTaskId = proposal.taskId ?? model.ui.openTaskId ?? null;
};

/**
 * @param {Object} model
 */
export const onFocusModeExit = (model) => {
  model.ui.focusMode = false;
  model.ui.focusTaskId = null;
};

/**
 * @param {Object} model
 * @param {{ type: 'TOAST_SHOW', message: string, variant?: string }} proposal
 */
export const onToastShow = (model, proposal) => {
  model.ui.toasts = model.ui.toasts ?? [];
  model.ui.toasts.push({
    id: Date.now().toString(),
    message: proposal.message,
    variant: proposal.variant ?? 'info',
  });
};

/**
 * @param {Object} model
 * @param {{ type: 'TOAST_DISMISS', toastId: string }} proposal
 */
export const onToastDismiss = (model, proposal) => {
  model.ui.toasts = (model.ui.toasts ?? []).filter(t => t.id !== proposal.toastId);
};
