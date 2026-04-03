/**
 * @module toast-renderer
 * @description Renders toast notifications.
 */

/** Track which toast IDs are currently rendered to avoid flicker */
const _rendered = new Set();

/**
 * @param {Object} cs - Control state
 */
export const updateToasts = (cs) => {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const current = new Set(cs.toasts.map(t => t.id));

  // Remove stale toasts
  for (const id of _rendered) {
    if (!current.has(id)) {
      const el = region.querySelector(`[data-toast-id="${id}"]`);
      if (el) {
        el.classList.add('removing');
        setTimeout(() => el.remove(), 300);
      }
      _rendered.delete(id);
    }
  }

  // Add new toasts
  for (const toast of cs.toasts) {
    if (_rendered.has(toast.id)) continue;
    _rendered.add(toast.id);

    const el = document.createElement('div');
    el.className = `toast toast-${toast.variant ?? 'info'}`;
    el.dataset.toastId = toast.id;
    el.setAttribute('role', 'alert');
    el.textContent = toast.message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-btn';
    closeBtn.style.cssText = 'margin-left:auto;flex-shrink:0';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    closeBtn.addEventListener('click', () => {
      window.__dispatch?.({ type: 'TOAST_DISMISS', toastId: toast.id });
    });
    el.appendChild(closeBtn);
    region.appendChild(el);

    // Auto-dismiss after 4s
    setTimeout(() => {
      window.__dispatch?.({ type: 'TOAST_DISMISS', toastId: toast.id });
    }, 4000);
  }
};
