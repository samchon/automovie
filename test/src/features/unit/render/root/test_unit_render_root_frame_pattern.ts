import { framePattern } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `framePattern` is the printf pattern of `frameName`.
 *
 * Scenarios:
 *
 * 1. The default: frame_%05d.png.
 * 2. Webp padded to 3: frame_%03d.webp.
 */
export function test_unit_render_root_frame_pattern(): void {
  TestValidator.equals("default", framePattern(), "frame_%05d.png");
  TestValidator.equals("webp", framePattern("webp", 3), "frame_%03d.webp");
}
