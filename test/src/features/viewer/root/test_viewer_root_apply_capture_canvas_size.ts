import { AutoMovieViewerDisplay } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerDisplay.applyCaptureCanvasSize` sets a capture canvas's CSS size.
 *
 * Scenarios:
 *
 * 1. 640 by 360 sets `640px` and `360px`.
 * 2. A zero or negative dimension leaves both styles as they were.
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