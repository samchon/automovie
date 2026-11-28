import {
  assertSingleGuidePass
} from "../../../../../packages/render/src/film/internal/assertSingleGuidePass";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertSingleGuidePass` returns the one distinct pass a deliverable declares.
 *
 * Scenarios:
 *
 * 1. A repeated pass folds to itself.
 * 2. No pass and two distinct passes are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Returns one distinct guide pass and refuses a request with zero or multiple distinct passes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the single-pass guard with a repeated pass, an empty list and two different passes.
 * @evidence contracts/development/testing.md#independent-expectations The known repeated name yields exactly one result, while the other two inputs must throw separately.
 */
export function test_render_film_assert_single_guide_pass(): void {
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