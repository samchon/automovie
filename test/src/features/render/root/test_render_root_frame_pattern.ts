import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderMedia.framePattern` is the printf pattern of `AutoMovieRenderMedia.frameName`.
 *
 * Scenarios:
 *
 * 1. The default: frame_%05d.png.
 * 2. Webp padded to 3: frame_%03d.webp.
 */
export function test_render_root_frame_pattern(): void {
  TestValidator.equals("default", AutoMovieRenderMedia.framePattern(), "frame_%05d.png");
  TestValidator.equals("webp", AutoMovieRenderMedia.framePattern("webp", 3), "frame_%03d.webp");
}
