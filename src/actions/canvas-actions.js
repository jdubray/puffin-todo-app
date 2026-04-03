/**
 * @module canvas-actions
 * @description Pure proposal-building functions for canvas operations.
 */

/**
 * Creates a CARD_MOVE proposal.
 * @param {string} taskId
 * @param {{ x: number, y: number }} position - New canvas-space position
 * @returns {Object}
 */
export const moveCard = (taskId, position) => ({
  type: 'CARD_MOVE',
  taskId,
  position,
});

/**
 * Creates a CANVAS_PAN proposal.
 * @param {{ x: number, y: number }} delta - Pan delta in screen pixels
 * @returns {Object}
 */
export const panCanvas = (delta) => ({
  type: 'CANVAS_PAN',
  delta,
});

/**
 * Creates a CANVAS_ZOOM proposal.
 * @param {number} newZoom - New zoom level (clamped by acceptor)
 * @param {{ x: number, y: number }} [focalPoint] - Screen-space zoom origin
 * @returns {Object}
 */
export const zoomCanvas = (newZoom, focalPoint) => ({
  type: 'CANVAS_ZOOM',
  zoom: newZoom,
  focalPoint,
});

/**
 * Creates a CANVAS_RESET proposal (centre view, reset zoom).
 * @returns {Object}
 */
export const resetCanvas = () => ({
  type: 'CANVAS_RESET',
});

/**
 * Creates a CANVAS_FIT_TASKS proposal (zoom/pan to fit all visible tasks).
 * @returns {Object}
 */
export const fitTasks = () => ({
  type: 'CANVAS_FIT_TASKS',
});
