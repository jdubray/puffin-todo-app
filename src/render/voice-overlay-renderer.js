/**
 * @module voice-overlay-renderer
 * @description Renders the voice capture overlay.
 */

import { html } from '../utils/safe-html.js';

/**
 * @param {Object} model
 * @param {Object} cs - Control state
 */
export const updateVoiceOverlay = (model, cs) => {
  const overlay = document.getElementById('voice-overlay');
  if (!overlay) return;

  const isOpen = cs.voiceActive;
  overlay.classList.toggle('open', isOpen);
  overlay.hidden = !isOpen;
  overlay.setAttribute('aria-hidden', String(!isOpen));

  if (!isOpen) return;

  if (!overlay.querySelector('.voice-container')) {
    overlay.innerHTML = _renderVoiceOverlay();
    _attachListeners(overlay);
  }
};

/**
 * Updates the transcript display (called by voice-service.js directly).
 * @param {string} interim - Interim transcript text
 * @param {string} final   - Final committed transcript text
 */
export const updateTranscript = (interim, final) => {
  const el = document.querySelector('.voice-transcript');
  if (!el) return;

  if (final) {
    el.textContent = final;
  } else {
    el.innerHTML = `<span class="interim">${html`${interim}`}</span>`;
  }
};

/**
 * Sets the listening state of the mic button.
 * @param {boolean} listening
 */
export const setListeningState = (listening) => {
  const btn = document.querySelector('.voice-mic-btn');
  if (btn) btn.classList.toggle('listening', listening);
};

// ── Private ───────────────────────────────────────────────

const _renderVoiceOverlay = () => `
  <div class="voice-container">
    <div class="voice-mic-ring">
      <button class="voice-mic-btn listening" aria-label="Stop listening" id="voice-mic-btn">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="11" y="4" width="10" height="16" rx="5" fill="white"/>
          <path d="M7 16a9 9 0 0018 0" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="16" y1="25" x2="16" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="voice-transcript" aria-live="polite" aria-atomic="false">
      <span class="interim">Listening…</span>
    </div>
    <button class="btn btn-ghost" id="voice-cancel" aria-label="Cancel voice capture">Cancel</button>
  </div>
`;

const _attachListeners = (overlay) => {
  const dispatch = window.__dispatch;

  overlay.querySelector('#voice-mic-btn')?.addEventListener('click', () => {
    dispatch({ type: 'VOICE_STOP' });
  });

  overlay.querySelector('#voice-cancel')?.addEventListener('click', () => {
    dispatch({ type: 'VOICE_STOP' });
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dispatch({ type: 'VOICE_STOP' });
  });
};
