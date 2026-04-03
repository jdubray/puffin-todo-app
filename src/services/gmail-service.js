/**
 * @module gmail-service
 * @description Optional Gmail OAuth integration.
 * Polls a Gmail label for emails to convert to tasks.
 */

import { LS_KEYS, GMAIL_POLL_INTERVAL_S } from '../core/constants.js';

const GMAIL_SCOPE   = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_API_BASE= 'https://gmail.googleapis.com/gmail/v1';

export const gmailService = {
  /**
   * Returns the stored OAuth token (or null if not connected).
   * @returns {Object|null}
   */
  getToken() {
    try {
      const raw = localStorage.getItem(LS_KEYS.GMAIL_TOKEN);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /**
   * Saves an OAuth token to localStorage.
   * @param {Object} token
   */
  saveToken(token) {
    try {
      localStorage.setItem(LS_KEYS.GMAIL_TOKEN, JSON.stringify(token));
    } catch { /* quota */ }
  },

  /**
   * Removes the stored token (disconnect).
   */
  clearToken() {
    localStorage.removeItem(LS_KEYS.GMAIL_TOKEN);
  },

  /**
   * Returns true if a Gmail token is stored.
   * @returns {boolean}
   */
  get isConnected() {
    return this.getToken() !== null;
  },

  /**
   * Polls the user's Gmail for messages with the configured label.
   * Returns an array of email objects for dispatch.
   *
   * @param {string} [labelName='pulse']
   * @returns {Promise<Object[]>}
   */
  async poll(labelName = 'pulse') {
    const token = this.getToken();
    if (!token) return [];

    try {
      const labelId = await this._getLabelId(token, labelName);
      if (!labelId) return [];

      const messages = await this._listMessages(token, labelId);
      const emails = await Promise.all(
        messages.slice(0, 10).map(m => this._getMessage(token, m.id))
      );
      return emails.filter(Boolean);
    } catch (err) {
      console.error('[gmailService] Poll error:', err);
      return [];
    }
  },

  /** @private */
  async _getLabelId(token, labelName) {
    const res = await fetch(`${GMAIL_API_BASE}/users/me/labels`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!res.ok) return null;
    const { labels } = await res.json();
    return labels?.find(l => l.name.toLowerCase() === labelName.toLowerCase())?.id ?? null;
  },

  /** @private */
  async _listMessages(token, labelId) {
    const res = await fetch(
      `${GMAIL_API_BASE}/users/me/messages?labelIds=${labelId}&maxResults=10`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );
    if (!res.ok) return [];
    const { messages } = await res.json();
    return messages ?? [];
  },

  /** @private */
  async _getMessage(token, messageId) {
    const res = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject,From`,
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const headers = data.payload?.headers ?? [];
    return {
      messageId,
      subject: headers.find(h => h.name === 'Subject')?.value ?? '(no subject)',
      from:    headers.find(h => h.name === 'From')?.value ?? '',
      snippet: data.snippet ?? '',
    };
  },
};
