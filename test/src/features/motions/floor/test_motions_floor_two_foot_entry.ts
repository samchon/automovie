import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  floorEntry
} from "../../../../../packages/motions/src/floor/internal/floorEntry";
import { TestValidator } from "@nestia/e2e";

/**
 * A two-foot crouch can start only while both feet bear.
 *
 * Scenarios:
 *
 * 1. A two-foot stance is admitted.
 * 2. A left-only, right-only or unsupported entry asks for standing and carries
 *    the owning law's explanation and correction.
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
