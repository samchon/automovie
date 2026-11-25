import { scaleAutoMovieCaptureLabels } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `scaleAutoMovieCaptureLabels` scales labels by how many cells' short sides
 * fit the raster's short side, rounded up and at least 1.
 *
 * Scenarios:
 *
 * 1. A 1920×1080 raster over 320×180 cells: ⌈1080 / 180⌉ = 6.
 * 2. A 1000×700 raster over 300×400 cells: ⌈700 / 300⌉ = 3.
 * 3. A raster smaller than its cell stays at 1.
 */
export function test_render_capture_scale_labels(): void {
  TestValidator.equals(
    "scales",
    [
      [1920, 1080, 320, 180],
      [1000, 700, 300, 400],
      [100, 50, 320, 180],
    ].map(([width, height, cellWidth, cellHeight]): number =>
      scaleAutoMovieCaptureLabels(
        { width: width!, height: height! },
        { cell: { width: cellWidth!, height: cellHeight! } },
      ),
    ),
    [6, 3, 1],
  );
}
