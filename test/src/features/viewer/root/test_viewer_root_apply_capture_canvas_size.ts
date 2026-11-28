import { AutoMovieViewerDisplay } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerDisplay.applyCaptureCanvasSize` sets a capture canvas's CSS size.
 *
 * Scenarios:
 *
 * 1. 640 by 360 sets `640px` and `360px`.
 * 2. A zero or negative dimension leaves both styles as they were.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Writes CSS dimensions for a valid capture size and preserves both styles on invalid dimensions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the canvas-size function on a typed style port with 640 × 360 followed by zero and negative controls.
 * @evidence contracts/development/testing.md#independent-expectations The exact CSS pixel strings give the successful state, and the same two strings must remain after each invalid input.
 */
export function test_viewer_root_apply_capture_canvas_size(): void {
  const canvas: { style: { width: string; height: string } } = {
    style: { width: "", height: "" },
  };
  AutoMovieViewerDisplay.applyCaptureCanvasSize({ canvas, width: 640, height: 360 });
  TestValidator.equals("size", canvas.style, { width: "640px", height: "360px" });
  AutoMovieViewerDisplay.applyCaptureCanvasSize({ canvas, width: 0, height: 100 });
  AutoMovieViewerDisplay.applyCaptureCanvasSize({ canvas, width: 100, height: -1 });
  TestValidator.equals("kept", canvas.style, { width: "640px", height: "360px" });
}