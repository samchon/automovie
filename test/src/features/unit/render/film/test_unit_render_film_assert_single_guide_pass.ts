import { assertSingleGuidePass } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertSingleGuidePass` returns the one distinct pass a deliverable declares.
 *
 * Scenarios:
 *
 * 1. A repeated pass folds to itself.
 * 2. No pass and two distinct passes are refused.
 */
export function test_unit_render_film_assert_single_guide_pass(): void {
  TestValidator.equals(
    "folded",
    assertSingleGuidePass(["depth", "depth"]),
    "depth",
  );
  TestValidator.error("none", (): void => {
    assertSingleGuidePass([]);
  });
  TestValidator.error("two", (): void => {
    assertSingleGuidePass(["depth", "mask"]);
  });
}