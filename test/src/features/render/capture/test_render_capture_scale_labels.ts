import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `scaleCaptureLabels` scales labels by how many cells' short sides
 * fit the raster's short side, rounded up and at least 1.
 *
 * Scenarios:
 *
 * 1. A 1920×1080 raster over 320×180 cells: ⌈1080 / 180⌉ = 6.
 * 2. A 1000×700 raster over 300×400 cells: ⌈700 / 300⌉ = 3.
 * 3. A raster smaller than its cell stays at 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the integer label scale from raster and cell shorter dimensions, with minimum one.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the scaling helper with landscape, mixed aspect and smaller-than-cell raster fixtures.
 * @evidence contracts/development/testing.md#independent-expectations Ratios use the minimum dimensions before ceiling. 1080/180 gives six, and a raster too small for one whole cell still gives one.
 */
export function test_render_capture_scale_labels(): void {
  TestValidator.equals(
    "scales",
    [
      [1920, 1080, 320, 180],
      [1000, 700, 300, 400],
      [100, 50, 320, 180],
    ].map(([width, height, cellWidth, cellHeight]): number =>
      AutoMovieRenderCapture.scaleLabels(
        { width: width!, height: height! },
        { cell: { width: cellWidth!, height: cellHeight! } },
      ),
    ),
    [6, 3, 1],
  );
}
