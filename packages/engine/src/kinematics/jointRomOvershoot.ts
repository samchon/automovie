import {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { scanJointRom } from "../rom/scanJointRom";

/**
 * The total range-of-motion overshoot of one joint's clinical angles, in
 * degrees, or `0` when the joint is within its constraint.
 *
 * It sums the overshoot of every fault {@link scanJointRom} reports, the
 * measure the pose gate's `validateJointRom` words into its violations, so a
 * solver that ranks candidates by this number cannot judge itself by a kinder
 * rule than the gate, and a ranking over hundreds of candidates builds no
 * message for any of them. A non-finite angle is reported without an
 * overshoot and scores `Infinity`, so it never wins a ranking. A `null`
 * constraint scores `0`.
 *
 * @param joint Clinical angles of one joint; `null` axes are at rest.
 * @param constraint The joint's resolved ROM, or `null` when unconstrained.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reduces the gate's own per-axis and swing-cone violations to one comparable sum, so ordering by it is ordering by the gate's distances; a violation without a measured distance is a non-finite angle, which the sum treats as infinitely far instead of free.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Sums `scanJointRom`'s faults instead of restating its limits, so `decomposeJointRotation`'s chart choice and `reachPose`'s candidate scoring read exactly the rule `validatePose` enforces.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no tolerance and no special case for any bone or axis; the `Infinity` score is the stated meaning of an unmeasurable violation, not a compensation.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the zero answer, that the gate's check is reused and why, the `Infinity` case, and what `null` means for the constraint and for an axis.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three axis checks plus at most one swing-cone check and a sum over at most four faults, constant per call, with no message and no collector built; the gate words the same faults, so the score cannot drift from it.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one joint and constraint that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the sum is a local number.
 */
export const jointRomOvershoot: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
) => number = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
): number => {
  if (constraint === null) return 0;
  let total: number = 0;
  scanJointRom(
    joint,
    constraint,
    // A fault with no overshoot is not a free one. `scanJointRom` omits the
    // measure exactly when the angle is NOT FINITE, which is worse than any
    // distance past a limit and has no distance to report. Scoring it `0` would
    // rank a malformed candidate as perfectly legal and let it win the
    // selection outright, so it is scored as unusable instead.
    (
      _part: scanJointRom.Part,
      _actual: number,
      overshoot: number | undefined,
    ): void => {
      total += overshoot ?? Number.POSITIVE_INFINITY;
    },
  );
  return total;
};
