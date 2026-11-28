import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `guidePassFramePattern` is the printf input pattern matching
 * `guidePassFrameName`: beauty untagged, other passes before the extension.
 *
 * Scenarios:
 *
 * 1. Beauty: frame_%05d.png.
 * 2. Mask as webp padded to 3: frame_%03d.mask.webp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Builds the encoder input pattern for beauty and a named guide pass.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the formatter for default beauty and an explicit three-digit WebP mask.
 * @evidence contracts/development/testing.md#independent-expectations The two literal patterns fix the location of the pass tag and the selected padding.
 */
export function test_render_root_guide_pass_frame_pattern(): void {
  TestValidator.equals(
    "beauty",
    AutoMovieRenderMedia.guidePassFramePattern("beauty"),
    "frame_%05d.png",
  );
  TestValidator.equals(
    "mask as webp",
    AutoMovieRenderMedia.guidePassFramePattern("mask", "webp", 3),
    "frame_%03d.mask.webp",
  );
}
