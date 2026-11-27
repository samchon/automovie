import { AutoMovieRenderFrameGrid } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderFrameGrid` places a film's frames on a fixed-rate grid that ends on
 * its duration.
 *
 * Scenarios, at 24 fps:
 *
 * 1. Two seconds end on frame 48; 0.1 s, 2.4 frames, needs a third frame because
 *    frame 2 at 1/12 s stops short of 0.1 s.
 * 2. Frame 5 of a 0.1 s film is clamped to 0.1 s; frame 1 is 1/24 s.
 * 3. Over three frames of 0.1 s: 0.05 s is nearest frame 1, 0.09 s frame 2, and
 *    0.1 s or later the closing frame 3.
 */
export function test_render_root_frame_grid(): void {
  TestValidator.equals(
    "last frames",
    [AutoMovieRenderFrameGrid.last(2, 24), AutoMovieRenderFrameGrid.last(0.1, 24)],
    [48, 3],
  );
  TestValidator.equals(
    "frame times",
    [AutoMovieRenderFrameGrid.time(5, 0.1, 24), AutoMovieRenderFrameGrid.time(1, 0.1, 24)],
    [0.1, 1 / 24],
  );
  TestValidator.equals(
    "nearest frames",
    [0.05, 0.09, 0.1, 5].map((seconds: number): number =>
      AutoMovieRenderFrameGrid.nearest(seconds, 0.1, 24, 3),
    ),
    [1, 2, 3, 3],
  );
}
