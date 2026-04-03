/**
 * @module command-palette-renderer
 * @description Renders the command palette overlay.
 */

import { html, trusted } from '../utils/safe-html.js';
import { fuzzyFilter } from '../utils/fuzzy-match.js';

/** Built-in commands shown when no query is typed */
const STATIC_COMMANDS = [
  { id: 'new-task',      label: 'New task',           kbd: 'N',      icon: '✚', action: { type: 'CAPTURE_OPEN' } },
  { id: 'voice',         label: 'Voice capture',      kbd: 'V',      icon: '🎙', action: { type: 'VOICE_START' } },
  { id: 'canvas',        label: 'Switch to Canvas',   kbd: '1',      icon: '◻', action: { type: 'VIEW_SWITCH', view: 'canvas' } },
  { id: 'timeline',      label: 'Switch to Timeline', kbd: '2',      icon: '📅', action: { type: 'VIEW_SWITCH', view: 'timeline' } },
  { id: 'memory',        label: 'Switch to Memory',   kbd: '3',      icon: '🗃', action: { type: 'VIEW_SWITCH', view: 'memory' } },
  { id: 'fit',           label: 'Fit tasks to screen',kbd: 'F',      icon: '⤢', action: { type: 'CANVAS_FIT_TASKS' } },
  { id: 'settings',      label: 'Open settings',      kbd: ',',      icon: '⚙', action: { type: 'SETTINGS_OPEN' } },
  { id: 'undo',          label: 'Undo',               kbd: 'Ctrl+Z', icon: '↩', action: { type: 'UNDO' } },
];

let _currentIndex = 0;

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateCommandPalette = (model, cs) => {
  const overlay = document.getElementById('command-palette');
  if (!overlay) return;

  const isOpen = cs.commandPaletteOpen;
  overlay.classList.toggle('open', isOpen);
  overlay.hidden = !isOpen;
  overlay.setAttribute('aria-hidden', String(!isOpen));

  if (!isOpen) return;

  // Re-render only if just opened or already rendered
  if (!overlay.querySelector('.palette-container')) {
    overlay.innerHTML = _renderPalette();
    _attachPaletteListeners(overlay, model);
  }

  requestAnimationFrame(() => overlay.querySelector('.palette-input')?.focus());
};

// ── Private ───────────────────────────────────────────────

const _renderPalette = (commands = STATIC_COMMANDS, query = '') => `
  <div class="palette-container" role="dialog" aria-label="Command palette">
    <div class="palette-input-wrap">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:var(--color-text-muted);flex-shrink:0" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input class="palette-input" type="text" placeholder="Search commands or tasks…"
             autocomplete="off" spellcheck="false" value="${query}" aria-label="Search commands"/>
    </div>
    <div class="palette-results" role="listbox" aria-label="Commands">
      ${commands.map((cmd, i) => `
        <div class="palette-item" role="option" aria-selected="${i === 0}" data-cmd-id="${cmd.id}" tabindex="-1">
          <span class="palette-item-icon" aria-hidden="true">${cmd.icon ?? '▸'}</span>
          <span>${cmd.label}</span>
          ${cmd.kbd ? `<kbd class="palette-item-kbd">${cmd.kbd}</kbd>` : ''}
        </div>
      `).join('')}
    </div>
  </div>
`;

const _attachPaletteListeners = (overlay, model) => {
  const dispatch = window.__dispatch;

  overlay.addEventListener('click', (e) => {
    // Click on backdrop closes
    if (e.target === overlay) dispatch({ type: 'COMMAND_PALETTE_CLOSE' });

    const item = e.target.closest('.palette-item');
    if (item) _executeItem(item.dataset.cmdId, model);
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dispatch({ type: 'COMMAND_PALETTE_CLOSE' });
      return;
    }
    const items = [...overlay.querySelectorAll('.palette-item')];
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _currentIndex = (_currentIndex + 1) % items.length;
      _highlightItem(items, _currentIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _currentIndex = (_currentIndex - 1 + items.length) % items.length;
      _highlightItem(items, _currentIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const id = items[_currentIndex]?.dataset.cmdId;
      if (id) _executeItem(id, model);
    }
  });

  const input = overlay.querySelector('.palette-input');
  input?.addEventListener('input', () => {
    const q = input.value.trim();
    const filtered = q
      ? fuzzyFilter(q, STATIC_COMMANDS, c => c.label)
      : STATIC_COMMANDS;
    const results = overlay.querySelector('.palette-results');
    if (results) {
      results.innerHTML = filtered.map((cmd, i) => `
        <div class="palette-item" role="option" aria-selected="${i === 0}" data-cmd-id="${cmd.id}" tabindex="-1">
          <span class="palette-item-icon" aria-hidden="true">${cmd.icon ?? '▸'}</span>
          <span>${cmd.label}</span>
          ${cmd.kbd ? `<kbd class="palette-item-kbd">${cmd.kbd}</kbd>` : ''}
        </div>
      `).join('');
      _currentIndex = 0;
    }
  });
};

const _executeItem = (cmdId, model) => {
  const dispatch = window.__dispatch;
  const cmd = STATIC_COMMANDS.find(c => c.id === cmdId);
  if (cmd) {
    dispatch({ type: 'COMMAND_PALETTE_CLOSE' });
    dispatch(cmd.action);
  }
};

const _highlightItem = (items, index) => {
  items.forEach((el, i) => el.setAttribute('aria-selected', String(i === index)));
  items[index]?.scrollIntoView({ block: 'nearest' });
};
