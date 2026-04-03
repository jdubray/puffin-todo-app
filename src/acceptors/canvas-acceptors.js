/**
 * @module canvas-acceptors
 * @description Acceptors for canvas pan, zoom, and card position proposals.
 */

import { db } from '../db/pulse-db.js';
import { todayISO } from '../utils/dates.js';
import { MIN_ZOOM, MAX_ZOOM, LS_KEYS } from '../core/constants.js';

/**
 * @param {Object} model
 * @param {{ type: 'CARD_MOVE', taskId: string, position: { x: number, y: number } }} proposal
 */
export const onCardMove = async (model, proposal) => {
  const task = model.tasks.find(t => t.id === proposal.taskId);
  if (!task) return;

  task.position = proposal.position;
  task.updatedAt = todayISO();

  const { urgency: _u, ...storable } = task; // eslint-disable-line no-unused-vars
  await db.tasks.put(storable);
  _persistCanvasState(model);
};

/**
 * @param {Object} model
 * @param {{ type: 'CANVAS_PAN', delta: { x: number, y: number } }} proposal
 */
export const onCanvasPan = (model, proposal) => {
  model.canvas.pan.x += proposal.delta.x;
  model.canvas.pan.y += proposal.delta.y;
  _persistCanvasState(model);
};

/**
 * @param {Object} model
 * @param {{ type: 'CANVAS_ZOOM', zoom: number, focalPoint?: { x: number, y: number } }} proposal
 */
export const onCanvasZoom = (model, proposal) => {
  const prevZoom = model.canvas.zoom;
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, proposal.zoom));
  const fp = proposal.focalPoint;

  if (fp) {
    // Adjust pan so the focal point stays fixed on screen
    const scale = nextZoom / prevZoom;
    model.canvas.pan.x = fp.x - (fp.x - model.canvas.pan.x) * scale;
    model.canvas.pan.y = fp.y - (fp.y - model.canvas.pan.y) * scale;
  }

  model.canvas.zoom = nextZoom;
  _persistCanvasState(model);
};

/**
 * @param {Object} model
 */
export const onCanvasReset = (model) => {
  model.canvas.pan = { x: 0, y: 0 };
  model.canvas.zoom = 1.0;
  _persistCanvasState(model);
};

/**
 * Zooms and pans to fit all visible tasks.
 * @param {Object} model
 */
export const onCanvasFitTasks = (model) => {
  const tasks = model.tasks.filter(t => t.position);
  if (!tasks.length) return onCanvasReset(model);

  const xs = tasks.map(t => t.position.x);
  const ys = tasks.map(t => t.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + 240; // card width approx
  const maxY = Math.max(...ys) + 100;

  const vpW = window.innerWidth;
  const vpH = window.innerHeight - 76; // toolbar + statusbar

  const scaleX = vpW  / (maxX - minX + 80);
  const scaleY = vpH  / (maxY - minY + 80);
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));

  model.canvas.zoom = zoom;
  model.canvas.pan = {
    x: (vpW  - (maxX + minX) * zoom) / 2,
    y: (vpH  - (maxY + minY) * zoom) / 2,
  };

  _persistCanvasState(model);
};

// ── Private ───────────────────────────────────────────────

const _persistCanvasState = (model) => {
  try {
    localStorage.setItem(LS_KEYS.CANVAS_STATE, JSON.stringify({
      pan:        model.canvas.pan,
      zoom:       model.canvas.zoom,
      activeView: model.ui.view,
    }));
  } catch {
    // storage quota or private browsing — non-fatal
  }
};
