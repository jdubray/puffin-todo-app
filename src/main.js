/**
 * @module main
 * @description Application bootstrap.
 * Hydrates the model from IndexedDB, wires all event listeners,
 * registers the Service Worker, and fires the initial render.
 */

import { model } from './model.js';
import { render } from './render.js';
import { initNap } from './nap.js';
import { db, openDb } from './db/pulse-db.js';
import { computeUrgency } from './core/urgency.js';
import { computeMomentum, cacheMomentum } from './core/momentum.js';
import { hydrateSettings } from './acceptors/settings-acceptors.js';
import { voiceService } from './services/voice-service.js';
import { handleVoiceTranscript } from './actions/voice-actions.js';
import { parseQuickCapture } from './parsers/nl-parser.js';
import { LS_KEYS, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './core/constants.js';

// ── Dispatch ──────────────────────────────────────────────

/**
 * Global dispatch — single entry point for all SAM proposals.
 * @param {Object} proposal
 */
const dispatch = (proposal) => model.present(proposal);

window.__dispatch = dispatch;

// ── Boot sequence ─────────────────────────────────────────

const boot = async () => {
  await openDb();

  const [tasks, projects, memories] = await Promise.all([
    db.tasks.toArray(),
    db.projects.toArray(),
    db.memories.toArray(),
  ]);

  model.tasks     = tasks.map(t => ({ ...t, urgency: computeUrgency(t) }));
  model.projects  = projects;
  model._memories = memories;

  hydrateSettings(model);
  _restoreCanvasState(model);
  _restoreStreak(model);

  model._momentum = computeMomentum(model, memories);
  cacheMomentum(model._momentum);

  initNap(dispatch);

  _wireKeyboard();
  _wireToolbar();
  _wireCanvas();
  _wireCaptureBar();
  _wireVoice();
  _wireServiceWorker();
  _handleStartupAction();

  render(model);

  // Read-only model snapshot for renderer drag calculations
  Object.defineProperty(window, '__modelSnapshot', {
    get: () => model,
    configurable: true,
  });

  console.log('[Pulse] Boot complete. Tasks:', model.tasks.length);
};

// ── Keyboard shortcuts ────────────────────────────────────

const _wireKeyboard = () => {
  document.addEventListener('keydown', (e) => {
    const tag     = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Global shortcuts always active
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      dispatch({ type: 'UNDO' });
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      dispatch({ type: 'COMMAND_PALETTE_OPEN' });
      return;
    }
    if (e.key === 'Escape') {
      dispatch({ type: 'COMMAND_PALETTE_CLOSE' });
      dispatch({ type: 'CAPTURE_CLOSE' });
      dispatch({ type: 'PANEL_CLOSE' });
      dispatch({ type: 'FOCUS_MODE_EXIT' });
      return;
    }

    if (inInput) return;

    switch (e.key) {
      case '1': dispatch({ type: 'VIEW_SWITCH', view: 'canvas' });   break;
      case '2': dispatch({ type: 'VIEW_SWITCH', view: 'timeline' }); break;
      case '3': dispatch({ type: 'VIEW_SWITCH', view: 'memory' });   break;
      case 'n': case 'N': dispatch({ type: 'CAPTURE_OPEN' });         break;
      case 'v': case 'V':
        if (!model.ui.voiceActive) dispatch({ type: 'VOICE_START' });
        break;
      case 'f': case 'F': dispatch({ type: 'CANVAS_FIT_TASKS' });    break;
      case '/':
        e.preventDefault();
        dispatch({ type: 'COMMAND_PALETTE_OPEN' });
        break;
    }
  });
};

// ── Toolbar ───────────────────────────────────────────────

const _wireToolbar = () => {
  document.getElementById('btn-voice')?.addEventListener('click', () => {
    dispatch({ type: model.ui.voiceActive ? 'VOICE_STOP' : 'VOICE_START' });
  });

  document.getElementById('btn-focus')?.addEventListener('click', () => {
    dispatch({ type: model.ui.focusMode ? 'FOCUS_MODE_EXIT' : 'FOCUS_MODE_ENTER',
               taskId: model.ui.openTaskId });
  });

  document.getElementById('btn-menu')?.addEventListener('click', () => {
    dispatch({ type: 'COMMAND_PALETTE_OPEN' });
  });

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => dispatch({ type: 'VIEW_SWITCH', view: btn.dataset.view }));
  });
};

// ── Canvas events ─────────────────────────────────────────

const _wireCanvas = () => {
  const viewport = document.getElementById('canvas-viewport');
  if (!viewport) return;

  let panStart = null;

  viewport.addEventListener('pointerdown', (e) => {
    const onSurface = e.target === viewport ||
                      e.target === document.getElementById('canvas-surface');
    if (!onSurface || e.button !== 0) return;
    panStart = { x: e.clientX, y: e.clientY };
    viewport.classList.add('panning');
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!panStart || !viewport.hasPointerCapture(e.pointerId)) return;
    dispatch({ type: 'CANVAS_PAN', delta: {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }});
    panStart = { x: e.clientX, y: e.clientY };
  });

  viewport.addEventListener('pointerup', () => {
    panStart = null;
    viewport.classList.remove('panning');
  });

  viewport.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta   = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, model.canvas.zoom + delta));
    dispatch({ type: 'CANVAS_ZOOM', zoom: newZoom, focalPoint: { x: e.clientX, y: e.clientY } });
  }, { passive: false });

  viewport.addEventListener('dblclick', (e) => {
    const onSurface = e.target === viewport ||
                      e.target === document.getElementById('canvas-surface');
    if (!onSurface) return;
    const pos = {
      x: (e.clientX - model.canvas.pan.x) / model.canvas.zoom,
      y: (e.clientY - model.canvas.pan.y) / model.canvas.zoom,
    };
    dispatch({ type: 'CAPTURE_OPEN', position: pos });
  });

  // Zoom controls in bottom-left
  _addZoomControls(viewport.closest('#view-canvas') ?? viewport.parentElement);
};

const _addZoomControls = (container) => {
  if (!container || container.querySelector('.zoom-controls')) return;
  const ctrl = document.createElement('div');
  ctrl.className = 'zoom-controls';
  ctrl.setAttribute('aria-label', 'Zoom controls');
  ctrl.innerHTML = `
    <button class="zoom-btn" id="zoom-in"  aria-label="Zoom in"  title="Zoom in (Ctrl+scroll)">+</button>
    <span   class="zoom-level" id="zoom-level" aria-live="polite">100%</span>
    <button class="zoom-btn" id="zoom-out" aria-label="Zoom out" title="Zoom out (Ctrl+scroll)">−</button>
  `;
  container.appendChild(ctrl);

  ctrl.querySelector('#zoom-in')?.addEventListener('click', () => {
    const newZoom = Math.min(MAX_ZOOM, model.canvas.zoom + ZOOM_STEP);
    dispatch({ type: 'CANVAS_ZOOM', zoom: newZoom });
    _updateZoomLabel(newZoom);
  });
  ctrl.querySelector('#zoom-out')?.addEventListener('click', () => {
    const newZoom = Math.max(MIN_ZOOM, model.canvas.zoom - ZOOM_STEP);
    dispatch({ type: 'CANVAS_ZOOM', zoom: newZoom });
    _updateZoomLabel(newZoom);
  });
};

const _updateZoomLabel = (zoom) => {
  const el = document.getElementById('zoom-level');
  if (el) el.textContent = `${Math.round(zoom * 100)}%`;
};

// ── Capture bar ───────────────────────────────────────────

const _wireCaptureBar = () => {
  const input     = document.getElementById('capture-input');
  const submitBtn = document.getElementById('capture-submit');
  const cancelBtn = document.getElementById('capture-cancel');

  const submit = () => {
    const raw = input?.value?.trim();
    if (!raw) { dispatch({ type: 'CAPTURE_CLOSE' }); return; }

    const parsed = parseQuickCapture(raw);
    dispatch({
      type: 'TASK_CREATE',
      task: {
        id: crypto.randomUUID(),
        title:    parsed.title || raw,
        body:     '',
        status:   'seed',
        energy:   parsed.energy   ?? 'medium',
        deadline: parsed.deadline ?? null,
        projectSlug: parsed.projectSlug ?? null,
        recurrence:  parsed.recurrence  ?? null,
        position: model.ui.capturePosition ?? {
          x: 100 + Math.random() * 300,
          y: 100 + Math.random() * 300,
        },
        tags:      [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    if (input) input.value = '';
    dispatch({ type: 'CAPTURE_CLOSE' });
    dispatch({ type: 'TOAST_SHOW', message: 'Task created', variant: 'success' });
  };

  submitBtn?.addEventListener('click', submit);
  cancelBtn?.addEventListener('click', () => dispatch({ type: 'CAPTURE_CLOSE' }));
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); submit(); }
    if (e.key === 'Escape') dispatch({ type: 'CAPTURE_CLOSE' });
  });
  input?.addEventListener('input', _updateCapturePreview);
};

const _updateCapturePreview = () => {
  const input   = document.getElementById('capture-input');
  const preview = document.getElementById('capture-preview');
  if (!input || !preview) return;

  const raw = input.value.trim();
  if (!raw) { preview.innerHTML = ''; return; }

  const parsed = parseQuickCapture(raw);
  const tags = [];
  if (parsed.projectSlug)
    tags.push(`<span class="preview-tag">#${parsed.projectSlug}</span>`);
  if (parsed.deadline)
    tags.push(`<span class="preview-tag">📅 ${new Date(parsed.deadline).toLocaleDateString()}</span>`);
  if (parsed.energy && parsed.energy !== 'medium')
    tags.push(`<span class="preview-tag">@${parsed.energy}</span>`);
  if (parsed.recurrence)
    tags.push(`<span class="preview-tag">🔁 ${parsed.recurrence.type}</span>`);

  preview.innerHTML = tags.join('');
};

// ── Voice ─────────────────────────────────────────────────

const _wireVoice = () => {
  const origPresent = model.present.bind(model);
  model.present = async function (proposal) {
    if (proposal.type === 'VOICE_START') {
      if (!voiceService.isSupported) {
        dispatch({ type: 'TOAST_SHOW', message: 'Voice capture not supported in this browser.', variant: 'warning' });
        return;
      }
      voiceService.start(
        () => {}, // interim handled by voice-overlay-renderer directly
        (final) => {
          const proposals = handleVoiceTranscript(final, model);
          proposals.forEach(p => dispatch(p));
          setTimeout(() => dispatch({ type: 'VOICE_STOP' }), 500);
        }
      );
    }
    if (proposal.type === 'VOICE_STOP') {
      voiceService.stop();
    }
    await origPresent(proposal);
  };
};

// ── Service Worker ────────────────────────────────────────

const _wireServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js', { type: 'module' })
    .then(reg => console.log('[SW] Registered, scope:', reg.scope))
    .catch(err => console.warn('[SW] Registration failed:', err));

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'GMAIL_POLL_REQUEST') dispatch({ type: 'GMAIL_POLL' });
    if (event.data?.type === 'RELOAD_TASKS')       dispatch({ type: 'RELOAD_TASKS' });
  });
};

// ── PWA startup action ────────────────────────────────────

const _handleStartupAction = () => {
  const action = new URL(window.location.href).searchParams.get('action');
  if (action === 'new-task') dispatch({ type: 'CAPTURE_OPEN' });
  if (action === 'voice')    dispatch({ type: 'VOICE_START' });
};

// ── Persistence helpers ───────────────────────────────────

const _restoreCanvasState = (m) => {
  try {
    const raw = localStorage.getItem(LS_KEYS.CANVAS_STATE);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.pan)  m.canvas.pan  = saved.pan;
    if (saved.zoom) m.canvas.zoom = saved.zoom;
  } catch { /* non-fatal */ }
};

const _restoreStreak = (m) => {
  try {
    const raw = localStorage.getItem(LS_KEYS.STREAK);
    if (raw) m.streak = JSON.parse(raw);
  } catch { /* non-fatal */ }
};

// ── Run ───────────────────────────────────────────────────

boot().catch(err => {
  console.error('[Pulse] Boot failed:', err);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;
                color:#f0f0f5;background:#0f0f0f;flex-direction:column;gap:1rem;padding:2rem;text-align:center">
      <h1 style="font-size:1.5rem">Pulse failed to start</h1>
      <p style="color:#888;max-width:400px">${err.message}</p>
      <button onclick="location.reload()"
              style="background:#6c63ff;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-size:1rem">
        Reload
      </button>
    </div>`;
});
