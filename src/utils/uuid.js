/**
 * @module uuid
 * @description Thin wrapper around crypto.randomUUID().
 */

/**
 * Generates a cryptographically random UUID v4.
 * @returns {string} UUID string
 */
export const generateId = () => crypto.randomUUID();
