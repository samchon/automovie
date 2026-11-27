import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay.js";

/*
 * Set finite positive CSS dimensions on a capture canvas; leave invalid sizes unchanged.
 */
export function applyCaptureCanvasSize(
  request: AutoMovieViewerDisplay.IApplyCaptureCanvasSizeRequest,
): void {
  if (request.width <= 0 || request.height <= 0) return;
  request.canvas.style.width = `${request.width}px`;
  request.canvas.style.height = `${request.height}px`;
}
