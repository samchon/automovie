import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  floorEntry
} from "../../../../../packages/motions/src/floor/internal/floorEntry";
import { TestValidator } from "@nestia/e2e";

/**
 * Check the footing required at the start of a two-foot floor action.
 *
 * Scenarios:
 *
 * 1. Accept an entry with both feet bearing.
 * 2. Refuse left-only, right-only and unsupported entries. Each refusal
 *    carries the supplied reason and correction and gives standing as the
 *    sole feasible value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios enumerate the support choices and the contents of the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification All four support combinations exercise the entry gate and its structured refusal.
 * @evidence contracts/development/testing.md#independent-expectations The fixture enumerates the two bearing flags and uses the authored refusal fields and feasible standing option as expectations.
 */
export function test_motions_floor_two_foot_entry(): void {
  floorEntry.bothFeet(true, true, "Crouch over both feet", "Stand first");
  const unsupported: readonly [boolean, boolean][] = [
    [true, false],
    [false, true],
    [false, false],
  ];
  for (const [left, right] of unsupported) {
    let refusal: AutoMovieMotionHumanRefusal | undefined;
    try {
      floorEntry.bothFeet(left, right, "Crouch over both feet", "Stand first");
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      refusal = error;
    }
    TestValidator.predicate(
      "name the required base and correction",
      refusal?.kind === "base" &&
        refusal.axis === "base" &&
        refusal.reason === "Crouch over both feet" &&
        refusal.fix === "Stand first" &&
        refusal.feasible?.kind === "alternatives" &&
        refusal.feasible.values.length === 1 &&
        refusal.feasible.values[0] === "standing",
    );
  }
}
