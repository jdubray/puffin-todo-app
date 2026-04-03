/**
 * @module integration-actions
 * @description Pure proposal-building functions for external integrations.
 */

/**
 * Creates a GMAIL_POLL proposal.
 * @returns {Object}
 */
export const pollGmail = () => ({ type: 'GMAIL_POLL' });

/**
 * Creates a GMAIL_TASK_IMPORT proposal from a parsed Gmail email.
 * @param {Object} email
 * @param {string} email.messageId
 * @param {string} email.subject
 * @param {string} email.from
 * @param {string} email.snippet
 * @returns {Object}
 */
export const importGmailTask = (email) => ({
  type: 'GMAIL_TASK_IMPORT',
  email,
});

/**
 * Creates a GMAIL_CONNECT proposal.
 * @param {Object} token - OAuth token object
 * @returns {Object}
 */
export const connectGmail = (token) => ({
  type: 'GMAIL_CONNECT',
  token,
});

/**
 * Creates a GMAIL_DISCONNECT proposal.
 * @returns {Object}
 */
export const disconnectGmail = () => ({ type: 'GMAIL_DISCONNECT' });

/**
 * Creates a RELOAD_TASKS proposal (from Service Worker background sync).
 * @returns {Object}
 */
export const reloadTasks = () => ({ type: 'RELOAD_TASKS' });
