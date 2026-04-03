/**
 * @module safe-html
 * @description XSS-safe tagged template literal for innerHTML.
 * Use this for ALL innerHTML assignments that include user-generated content.
 *
 * @example
 * import { html } from '../utils/safe-html.js';
 * el.innerHTML = html`<h3>${task.title}</h3><p>${task.body}</p>`;
 */

/**
 * Escapes HTML special characters in a string.
 * @param {string} str
 * @returns {string}
 */
export const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Tagged template literal that escapes all interpolated values.
 * Static template parts are trusted (developer-authored); only
 * interpolated values are escaped.
 *
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {string} Safe HTML string
 */
export const html = (strings, ...values) => {
  let result = '';
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      const val = values[i];
      // Allow passing a SafeHtml object to embed pre-escaped markup
      result += val instanceof SafeHtml ? val.toString() : escapeHtml(val ?? '');
    }
  });
  return result;
};

/**
 * Wraps a pre-escaped HTML string so it can be embedded inside `html` templates
 * without double-escaping. Use only for developer-trusted markup.
 *
 * @example
 * const icon = trusted('<svg>…</svg>');
 * const card = html`<div>${icon}<span>${title}</span></div>`;
 */
export class SafeHtml {
  /** @param {string} markup */
  constructor(markup) { this._markup = markup; }
  toString() { return this._markup; }
}

/**
 * Marks a string as trusted HTML (no escaping).
 * Only use for developer-controlled strings, never for user input.
 * @param {string} markup
 * @returns {SafeHtml}
 */
export const trusted = (markup) => new SafeHtml(markup);
