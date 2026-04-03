/**
 * @module render
 * @description Top-level render router.
 * Receives the full model, derives control state, and delegates to sub-renderers.
 */

import { deriveControlState } from './state.js';
import { updateToolbar }         from './render/toolbar-renderer.js';
import { updateCanvas }          from './render/canvas-renderer.js';
import { updateTaskEditor }      from './render/task-editor-renderer.js';
import { updateCommandPalette }  from './render/command-palette-renderer.js';
import { updateVoiceOverlay }    from './render/voice-overlay-renderer.js';
import { updateFocusMode }       from './render/focus-mode-renderer.js';
import { updateTimeline }        from './render/timeline-renderer.js';
import { updateMemoryVault }     from './render/memory-vault-renderer.js';
import { updateToasts }          from './render/toast-renderer.js';
import { updateStatusBar }       from './render/status-bar-renderer.js';

/**
 * Full render pass — called after every model mutation.
 * @param {Object} model
 */
export const render = (model) => {
  const cs = deriveControlState(model);

  updateToolbar(model, cs);
  updateCanvas(model, cs);
  updateTaskEditor(model, cs);
  updateCommandPalette(model, cs);
  updateVoiceOverlay(model, cs);
  updateFocusMode(model, cs);
  updateTimeline(model, cs);
  updateMemoryVault(model, cs);
  updateToasts(cs);
  updateStatusBar(model, cs);

  // Sync view visibility
  _syncViews(cs.view);
  // Sync capture bar
  _syncCaptureBar(cs.captureBarOpen);
};

// ── Private helpers ───────────────────────────────────────

const _syncViews = (activeView) => {
  document.querySelectorAll('.view').forEach(el => {
    const isActive = el.id === `view-${activeView}`;
    el.classList.toggle('active', isActive);
    el.hidden = !isActive;
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    const active = btn.dataset.view === activeView;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
};

const _syncCaptureBar = (open) => {
  const bar = document.getElementById('capture-bar');
  if (!bar) return;
  bar.hidden = !open;
  bar.setAttribute('aria-hidden', String(!open));
  bar.classList.toggle('open', open);
  if (open) {
    requestAnimationFrame(() => document.getElementById('capture-input')?.focus());
  }
};
