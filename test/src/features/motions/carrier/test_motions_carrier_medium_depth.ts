import {
  HumanMediumWalk
} from "../../../../../packages/motions/src/carrier/internal/HumanMediumWalk";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Check each medium's measured anatomical depth limit.
 *
 * Scenarios:
 *
 * 1. With a chest at 1.2 m and a 0.4 m shank, admit water at chest depth.
 *    Refuse water at 0 and 1.3 m with a 1.2 m maximum.
 * 2. Admit mud at zero and shank depth. Refuse snow at -0.01 and 0.5 m with a
 *    0.4 m maximum.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the anatomical measurements and each medium's depth cases.
 * @evidence contracts/development/testing.md#behavioral-verification The gate distinguishes water's positive depth from the shallower measured limits and reports `medium.depth` on refusal.
 * @evidence contracts/development/testing.md#independent-expectations The test sets the chest and shank lengths directly and compares the exact reporting maxima against those inputs.
 */
export function test_motions_carrier_medium_depth(): void {
  const measure: HumanMediumWalk.IMeasure = { chestHeight: 1.2, shank: 0.4 };
  HumanMediumWalk.admitDepth({ kind: "water", depth: 1.2 }, measure);
  HumanMediumWalk.admitDepth({ kind: "mud", depth: 0 }, measure);
  HumanMediumWalk.admitDepth({ kind: "mud", depth: 0.4 }, measure);

  function limit(
    kind: "water" | "snow",
    depth: number,
  ): number | null | undefined {
    try {
      HumanMediumWalk.admitDepth({ kind, depth }, measure);
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      if (error.axis === "medium.depth" && error.feasible?.kind === "range")
        return error.feasible.maximum;
    }
    return undefined;
  }
  TestValidator.equals(
    "use the admitted medium's anatomical limit",
    [
      limit("water", 0),
      limit("water", 1.3),
      limit("snow", -0.01),
      limit("snow", 0.5),
    ],
    [1.2, 1.2, 0.4, 0.4],
  );
}
