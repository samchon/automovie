import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderMedia.framePattern` is the printf pattern of `AutoMovieRenderMedia.frameName`.
 *
 * Scenarios:
 *
 * 1. The default: frame_%05d.png.
 * 2. Webp padded to 3: frame_%03d.webp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Formats image-sequence printf patterns with default or explicit extension and padding.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the frame-pattern formatter with no arguments and a three-digit WebP request.
 * @evidence contracts/development/testing.md#independent-expectations The exact PNG and WebP patterns distinguish the padding and extension decisions independently.
 */
export function test_render_root_frame_pattern(): void {
  TestValidator.equals("default", AutoMovieRenderMedia.framePattern(), "frame_%05d.png");
  TestValidator.equals("webp", AutoMovieRenderMedia.framePattern("webp", 3), "frame_%03d.webp");
}
