import { applyCaptureCanvasSize } from "@automovie/viewer/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `applyCaptureCanvasSize` sets a capture canvas's CSS size.
 *
 * Scenarios:
 *
 * 1. 640 by 360 sets `640px` and `360px`.
 * 2. A zero or negative dimension leaves both styles as they were.
 */
export function test_unit_viewer_root_apply_capture_canvas_size(): void {
  const canvas: { style: { width: string; height: string } } = {
    style: { width: "", height: "" },
  };
  applyCaptureCanvasSize(canvas, 640, 360);
  TestValidator.equals("size", canvas.style, { width: "640px", height: "360px" });
  applyCaptureCanvasSize(canvas, 0, 100);
  applyCaptureCanvasSize(canvas, 100, -1);
  TestValidator.equals("kept", canvas.style, { width: "640px", height: "360px" });
}