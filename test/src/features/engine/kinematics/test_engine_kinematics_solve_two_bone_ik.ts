import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieTwoBoneIK } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one law-of-cosines `acos`. */
const ROUNDING: number = 1e-9;

/**
 * `solveTwoBoneIK` gives the joint bend and the lift of the upper bone for a
 * two-bone chain reaching a distance, by the law of cosines, clamping the
 * distance to `|upper - lower| .. upper + lower`.
 *
 * Scenarios:
 *
 * 1. Bones 3 and 4 reaching 5: bend acos(0) = 90, lift acos(3/5) = 53.1301...
 * 2. Fully stretched at 7: bend 180, lift 0, unclamped.
 * 3. Reaching 10 clamps to 7, flagged clamped.
 * 4. Fully folded at 1: bend 0, lift 180.
 * 5. A non-positive bone length is refused.
 */
export function test_engine_kinematics_solve_two_bone_ik(): void {
  const right: IAutoMovieTwoBoneIK = AutoMovieEngineKinematics.solveTwoBoneIK(3, 4, 5);
  TestValidator.predicate(
    "the 3-4-5 triangle",
    nclose(right.bend, 90, ROUNDING) &&
      nclose(right.lift, (Math.acos(0.6) * 180) / Math.PI, ROUNDING) &&
      !right.clamped,
  );
  const straight: IAutoMovieTwoBoneIK = AutoMovieEngineKinematics.solveTwoBoneIK(3, 4, 7);
  TestValidator.predicate(
    "stretched",
    nclose(straight.bend, 180, ROUNDING) &&
      nclose(straight.lift, 0, ROUNDING) &&
      !straight.clamped,
  );
  const over: IAutoMovieTwoBoneIK = AutoMovieEngineKinematics.solveTwoBoneIK(3, 4, 10);
  TestValidator.predicate(
    "clamped",
    over.clamped && nclose(over.bend, 180, ROUNDING),
  );
  const folded: IAutoMovieTwoBoneIK = AutoMovieEngineKinematics.solveTwoBoneIK(3, 4, 1);
  TestValidator.predicate(
    "folded",
    nclose(folded.bend, 0, ROUNDING) && nclose(folded.lift, 180, ROUNDING),
  );
  TestValidator.predicate(
    "a zero bone",
    throwsError(() => AutoMovieEngineKinematics.solveTwoBoneIK(0, 4, 2), "upper length must be > 0"),
  );
}
