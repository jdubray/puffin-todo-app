/**
 * @module canvas-renderer
 * @description Keyed in-place reconciler for canvas task cards.
 * Never replaces the full innerHTML of the surface — only adds, removes,
 * and patches individual card elements to preserve drag state and animations.
 */

import { html, trusted } from '../utils/safe-html.js';
import { relativeTime, isOverdue, isDueSoon } from '../utils/dates.js';
import { urgencyLevel } from '../core/urgency.js';

/** @type {Map<string, HTMLElement>} taskId → card element */
const _cardMap = new Map();

/**
 * Main entry point called from render.js on every render pass.
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateCanvas = (model, cs) => {
  const surface = document.getElementById('canvas-surface');
  if (!surface) return;

  // Apply canvas transform
  _updateSurfaceTransform(model.canvas);

  // Reconcile cards
  const taskIds = new Set(model.tasks.map(t => t.id));

  // Remove cards no longer in model
  for (const [id, el] of _cardMap) {
    if (!taskIds.has(id)) {
      _removeCard(el, id);
    }
  }

  // Add or update cards
  for (const task of model.tasks) {
    if (_cardMap.has(task.id)) {
      _updateCard(_cardMap.get(task.id), task, cs);
    } else {
      const el = _createCard(task, cs);
      surface.appendChild(el);
      _cardMap.set(task.id, el);
      // Entry animation
      requestAnimationFrame(() => el.classList.add('entering'));
      setTimeout(() => el.classList.remove('entering'), 300);
    }
  }
};

/**
 * Applies a CSS transform to the canvas surface for pan + zoom.
 * @param {{ pan: { x: number, y: number }, zoom: number }} canvas
 */
const _updateSurfaceTransform = ({ pan, zoom }) => {
  const surface = document.getElementById('canvas-surface');
  if (!surface) return;
  surface.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
};

/**
 * Creates a new task card DOM element.
 * @param {Object} task
 * @param {Object} cs
 * @returns {HTMLElement}
 */
const _createCard = (task, cs) => {
  const el = document.createElement('div');
  el.className = 'task-card';
  el.setAttribute('role', 'article');
  el.setAttribute('tabindex', '0');
  el.dataset.taskId = task.id;
  _applyCardAttributes(el, task, cs);
  _setCardContent(el, task);
  _attachCardListeners(el, task.id);
  return el;
};

/**
 * Updates an existing card element with changed task data.
 * @param {HTMLElement} el
 * @param {Object} task
 * @param {Object} cs
 */
const _updateCard = (el, task, cs) => {
  _applyCardAttributes(el, task, cs);
  _setCardContent(el, task);
};

/**
 * Sets data attributes, position transform, and ARIA on a card.
 */
const _applyCardAttributes = (el, task, cs) => {
  const level = urgencyLevel(task.urgency ?? 0);

  el.dataset.status  = task.status;
  el.dataset.urgency = level;
  el.setAttribute('aria-label', `${task.title}, status: ${task.status}`);
  el.classList.toggle('selected', cs.selectedTaskIds?.includes(task.id) ?? false);

  // Position via transform — never top/left
  if (task.position) {
    el.style.transform = `translate(${task.position.x}px, ${task.position.y}px)`;
  }
};

/**
 * Updates the inner HTML of a card.
 * Uses the `html` tagged template for XSS safety on user content.
 */
const _setCardContent = (el, task) => {
  const deadlineHtml = _deadlineHtml(task.deadline);
  const projectHtml  = task.projectSlug
    ? html`<span class="card-project">#${task.projectSlug}</span>`
    : '';
  const energyHtml   = task.energy && task.energy !== 'medium'
    ? html`<span class="card-energy">${task.energy === 'high' ? '⚡' : '🔋'}</span>`
    : '';

  el.innerHTML = html`
    <div class="card-header">
      <span class="card-title">${task.title}</span>
      <button class="icon-btn card-menu-btn" aria-label="Task options" data-task-id="${task.id}" tabindex="-1">
        ${trusted(_dotsIcon())}
      </button>
    </div>
    <div class="card-meta">
      ${trusted(projectHtml)}
      ${trusted(deadlineHtml)}
      ${trusted(energyHtml)}
    </div>
    <button class="card-complete-btn" aria-label="Complete task" data-task-id="${task.id}" tabindex="-1">
      ${trusted(_checkIcon())}
    </button>
  `;
};

/**
 * Attaches pointer and keyboard event listeners to a card.
 * Listeners call dispatch via the global window.__dispatch.
 */
const _attachCardListeners = (el, taskId) => {
  let dragStartX, dragStartY, cardStartX, cardStartY, isDragging = false;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.card-complete-btn, .card-menu-btn')) return;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const task = _getTaskFromId(taskId);
    cardStartX = task?.position?.x ?? 0;
    cardStartY = task?.position?.y ?? 0;
    isDragging = false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!isDragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isDragging = true;
      el.classList.add('dragging');
    }
    if (isDragging) {
      const zoom = _getZoom();
      el.style.transform = `translate(${cardStartX + dx / zoom}px, ${cardStartY + dy / zoom}px)`;
    }
  });

  el.addEventListener('pointerup', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    el.classList.remove('dragging');
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const zoom = _getZoom();
      window.__dispatch({ type: 'CARD_MOVE', taskId, position: {
        x: cardStartX + dx / zoom,
        y: cardStartY + dy / zoom,
      }});
    } else {
      window.__dispatch({ type: 'PANEL_OPEN', taskId });
    }
    isDragging = false;
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.__dispatch({ type: 'PANEL_OPEN', taskId });
    }
  });

  // Quick complete
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-complete-btn');
    if (btn) {
      e.stopPropagation();
      el.classList.add('completing');
      setTimeout(() => window.__dispatch({ type: 'TASK_COMPLETE', taskId, completedAt: new Date().toISOString() }), 200);
    }
    const menuBtn = e.target.closest('.card-menu-btn');
    if (menuBtn) {
      e.stopPropagation();
      _showCardContextMenu(el, taskId, e);
    }
  });
};

/**
 * Animates and removes a card element.
 */
const _removeCard = (el, id) => {
  _cardMap.delete(id);
  el.classList.add('exiting');
  setTimeout(() => el.remove(), 250);
};

// ── Private helpers ───────────────────────────────────────

const _deadlineHtml = (deadline) => {
  if (!deadline) return '';
  const cls = isOverdue(deadline) ? 'overdue' : isDueSoon(deadline) ? 'due-soon' : '';
  return html`<span class="card-deadline ${cls}">${relativeTime(deadline)}</span>`;
};

const _dotsIcon = () =>
  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="13" cy="8" r="1.5" fill="currentColor"/>
  </svg>`;

const _checkIcon = () =>
  `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const _getTaskFromId = (taskId) => {
  // Access the model via a read-only snapshot stored on window
  return window.__modelSnapshot?.tasks?.find(t => t.id === taskId);
};

const _getZoom = () => window.__modelSnapshot?.canvas?.zoom ?? 1;

const _showCardContextMenu = (cardEl, taskId, e) => {
  // Remove any existing menu
  document.querySelector('.dropdown-menu')?.remove();

  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <button class="dropdown-item" data-action="open"     role="menuitem">Open</button>
    <button class="dropdown-item" data-action="complete" role="menuitem">Complete</button>
    <button class="dropdown-item" data-action="snooze"   role="menuitem">Snooze…</button>
    <button class="dropdown-item" data-action="block"    role="menuitem">Mark blocked</button>
    <div class="dropdown-separator"></div>
    <button class="dropdown-item danger" data-action="delete" role="menuitem">Delete</button>
  `;

  // Position near click
  const rect = cardEl.getBoundingClientRect();
  menu.style.cssText = `position:fixed;top:${rect.top + 24}px;left:${rect.right - 180}px`;
  document.body.appendChild(menu);

  menu.addEventListener('click', (ev) => {
    const action = ev.target.closest('[data-action]')?.dataset.action;
    menu.remove();
    if (!action) return;
    switch (action) {
      case 'open':     window.__dispatch({ type: 'PANEL_OPEN', taskId }); break;
      case 'complete': window.__dispatch({ type: 'TASK_COMPLETE', taskId, completedAt: new Date().toISOString() }); break;
      case 'block':    window.__dispatch({ type: 'TASK_BLOCK', taskId }); break;
      case 'delete':   window.__dispatch({ type: 'TASK_DELETE', taskId }); break;
    }
  });

  // Dismiss on outside click
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
};
