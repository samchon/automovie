import { guidePassFramePattern } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `guidePassFramePattern` is the printf input pattern matching
 * `guidePassFrameName`: beauty untagged, other passes before the extension.
 *
 * Scenarios:
 *
 * 1. Beauty: frame_%05d.png.
 * 2. Mask as webp padded to 3: frame_%03d.mask.webp.
 */
export function test_unit_render_root_guide_pass_frame_pattern(): void {
  TestValidator.equals("beauty", guidePassFramePattern("beauty"), "frame_%05d.png");
  TestValidator.equals(
    "mask as webp",
    guidePassFramePattern("mask", "webp", 3),
    "frame_%03d.mask.webp",
  );
}