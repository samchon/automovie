import { mixAutoMovieStraightAlpha } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `mixAutoMovieStraightAlpha` mixes associated (premultiplied) colour and
 * alpha at one weight and returns straight colour (Porter and Duff 1984).
 *
 * Scenarios:
 *
 * 1. Opaque red and opaque blue at ½: (128, 0, 128, 255), the straight mix
 *    (127.5 rounds up).
 * 2. Opaque white over a transparent pixel at ½: the colour stays white and
 *    alpha falls to 128, with no dark fringe.
 * 3. A fade (incoming null) of (40, 80, 120, 200) at ¾: colour kept, alpha
 *    ¼ × 200 = 50.
 * 4. Weight 1.5 refuses.
 */
export function test_unit_render_scene_mix_straight_alpha(): void {
  TestValidator.equals(
    "two opaque pixels",
    mixAutoMovieStraightAlpha([255, 0, 0, 255], [0, 0, 255, 255], 0.5),
    [128, 0, 128, 255],
  );
  TestValidator.equals(
    "over a transparent pixel",
    mixAutoMovieStraightAlpha([255, 255, 255, 255], [0, 0, 0, 0], 0.5),
    [255, 255, 255, 128],
  );
  TestValidator.equals(
    "a fade",
    mixAutoMovieStraightAlpha([40, 80, 120, 200], null, 0.75),
    [40, 80, 120, 50],
  );
  TestValidator.error("a weight past one", (): unknown =>
    mixAutoMovieStraightAlpha([0, 0, 0, 255], null, 1.5),
  );
}