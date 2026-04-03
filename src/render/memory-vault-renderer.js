/**
 * @module memory-vault-renderer
 * @description Renders the Memory Vault view — completed and archived tasks.
 */

import { html, trusted } from '../utils/safe-html.js';
import { relativeTime } from '../utils/dates.js';

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateMemoryVault = (model, cs) => {
  if (cs.view !== 'memory') return;

  const container = document.getElementById('memory-content');
  if (!container) return;

  const memories = model._memories ?? [];

  if (!memories.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🗃</div>
        <div class="empty-state-title">Memory vault is empty</div>
        <div class="empty-state-hint">Completed tasks will appear here.</div>
      </div>`;
    return;
  }

  const sorted = [...memories].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

  container.innerHTML = `
    <div class="memory-vault">
      <div class="memory-header">
        <input type="text" id="memory-search" class="capture-input"
               placeholder="Search memories…" aria-label="Search memories"
               style="border:1px solid var(--color-border);border-radius:var(--radius-medium);padding:var(--spacing-sm) var(--spacing-md);width:100%;max-width:480px"/>
      </div>
      <div class="memory-list" id="memory-list">
        ${sorted.map(_renderMemory).join('')}
      </div>
    </div>
  `;

  _attachListeners(container, memories);
};

// ── Private ───────────────────────────────────────────────

const _renderMemory = (m) => html`
  <div class="memory-card" data-memory-id="${m.id}">
    <div class="memory-card-title">${m.title}</div>
    <div class="memory-card-meta">
      <span class="status-pill" data-status="${m.status}">${m.status}</span>
      ${m.projectSlug ? trusted(html`<span class="card-project">#${m.projectSlug}</span>`) : ''}
      <span style="color:var(--color-text-muted);font-size:var(--font-size-xs)">${relativeTime(m.completedAt)}</span>
    </div>
  </div>
`;

const _attachListeners = (container, memories) => {
  const searchInput = container.querySelector('#memory-search');
  const list        = container.querySelector('#memory-list');

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const filtered = q
      ? memories.filter(m => m.title?.toLowerCase().includes(q))
      : memories;
    const sorted = [...filtered].sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
    if (list) list.innerHTML = sorted.map(_renderMemory).join('');
  });
};
