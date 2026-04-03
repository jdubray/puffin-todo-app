/**
 * @module model
 * @description The SAM Model — single mutable source of truth.
 * Exposes present(proposal) which routes proposals to acceptors,
 * then triggers state representation and NAP.
 */

import {
  onTaskCreate, onTaskUpdate, onTaskComplete, onTaskArchive,
  onTaskSnooze, onTaskWake, onTaskBlock, onTaskUnblock,
  onTaskDelete, onTaskSelect, onUndo,
} from './acceptors/task-acceptors.js';
import {
  onCardMove, onCanvasPan, onCanvasZoom,
  onCanvasReset, onCanvasFitTasks,
} from './acceptors/canvas-acceptors.js';
import {
  onPanelOpen, onPanelClose, onViewSwitch,
  onCaptureOpen, onCaptureClose,
  onCommandPaletteOpen, onCommandPaletteClose,
  onFocusModeEnter, onFocusModeExit,
  onToastShow, onToastDismiss,
} from './acceptors/ui-acceptors.js';
import { onSettingsUpdate, onSettingsReset } from './acceptors/settings-acceptors.js';
import { render } from './render.js';
import { nap } from './nap.js';

/** @type {Object} */
export const model = {
  tasks:    [],
  projects: [],
  canvas: { pan: { x: 0, y: 0 }, zoom: 1.0 },
  ui: {
    view: 'canvas',
    openTaskId: null,
    selectedTaskIds: [],
    captureBarOpen: false,
    capturePosition: null,
    commandPaletteOpen: false,
    focusMode: false,
    focusTaskId: null,
    toasts: [],
  },
  settings: {},
  streak: { count: 0, lastCompletionDate: null },

  // Internal undo stack (in-memory, persisted to IDB separately)
  _undoStack: [],
  // Next Gmail poll timestamp
  _gmailNextPoll: null,

  /**
   * Accepts a proposal and mutates model state if valid.
   * @param {Object} proposal
   */
  async present(proposal) {
    const acceptor = ACCEPTORS[proposal.type];
    if (!acceptor) {
      console.warn(`[model] No acceptor for proposal type: ${proposal.type}`);
      return;
    }

    await acceptor(this, proposal);
    render(this);
    nap(this);
  },
};

/** Dispatch table mapping proposal types to acceptor functions */
const ACCEPTORS = {
  // Task lifecycle
  TASK_CREATE:   onTaskCreate,
  TASK_UPDATE:   onTaskUpdate,
  TASK_COMPLETE: onTaskComplete,
  TASK_ARCHIVE:  onTaskArchive,
  TASK_SNOOZE:   onTaskSnooze,
  TASK_WAKE:     onTaskWake,
  TASK_BLOCK:    onTaskBlock,
  TASK_UNBLOCK:  onTaskUnblock,
  TASK_DELETE:   onTaskDelete,
  TASK_SELECT:   onTaskSelect,

  // Canvas
  CARD_MOVE:          onCardMove,
  CANVAS_PAN:         onCanvasPan,
  CANVAS_ZOOM:        onCanvasZoom,
  CANVAS_RESET:       onCanvasReset,
  CANVAS_FIT_TASKS:   onCanvasFitTasks,

  // UI
  PANEL_OPEN:             onPanelOpen,
  PANEL_CLOSE:            (m) => onPanelClose(m),
  VIEW_SWITCH:            onViewSwitch,
  CAPTURE_OPEN:           onCaptureOpen,
  CAPTURE_CLOSE:          (m) => onCaptureClose(m),
  COMMAND_PALETTE_OPEN:   (m) => onCommandPaletteOpen(m),
  COMMAND_PALETTE_CLOSE:  (m) => onCommandPaletteClose(m),
  FOCUS_MODE_ENTER:       onFocusModeEnter,
  FOCUS_MODE_EXIT:        (m) => onFocusModeExit(m),
  TOAST_SHOW:             onToastShow,
  TOAST_DISMISS:          onToastDismiss,

  // Settings
  SETTINGS_UPDATE: onSettingsUpdate,
  SETTINGS_RESET:  (m) => onSettingsReset(m),

  // Undo
  UNDO: (m) => onUndo(m),

  // Voice UI
  VOICE_START: (m) => { m.ui.voiceActive = true; },
  VOICE_STOP:  (m) => { m.ui.voiceActive = false; },

  // No-ops handled by NAP / services
  FLASHBACK_CHECK:   () => {},
  GMAIL_POLL:        () => {},
  GMAIL_TASK_IMPORT: () => {},
  GMAIL_CONNECT:     () => {},
  GMAIL_DISCONNECT:  () => {},
  RELOAD_TASKS:      () => {},
  VOICE_QUERY_TODAY:    () => {},
  VOICE_QUERY_MOMENTUM: () => {},
  VOICE_TASK_NOT_FOUND: () => {},
  VOICE_UNKNOWN:        () => {},
};
