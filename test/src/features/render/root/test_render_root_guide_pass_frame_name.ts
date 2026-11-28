import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `guidePassFrameName` names one pass's frame `frame_<index>.<ext>`, the index
 * zero-padded, with every pass but beauty inserted before the extension.
 *
 * Scenarios:
 *
 * 1. Frame 42 of beauty: frame_00042.png.
 * 2. Frame 42 of depth: frame_00042.depth.png.
 * 3. Frame 7 of mask as jpg padded to 3: frame_007.mask.jpg.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names beauty frames with the base filename and tags control frames before their extension.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the pass filename formatter on beauty, depth, and a mask with custom JPEG padding.
 * @evidence contracts/development/testing.md#independent-expectations The three literal names independently pin the pass suffix, numeric width and extension.
 */
export function test_render_root_guide_pass_frame_name(): void {
  TestValidator.equals(
    "beauty",
    AutoMovieRenderMedia.guidePassFrameName(42, "beauty"),
    "frame_00042.png",
  );
  TestValidator.equals(
    "depth",
    AutoMovieRenderMedia.guidePassFrameName(42, "depth"),
    "frame_00042.depth.png",
  );
  TestValidator.equals(
    "mask as jpg",
    AutoMovieRenderMedia.guidePassFrameName(7, "mask", "jpg", 3),
    "frame_007.mask.jpg",
  );
}
