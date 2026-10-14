import {
  IAutoMovieConstraintViolation,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { validateJointRom } from "../rom/validateJointRom";
import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * The total range-of-motion overshoot of one joint's clinical angles, in
 * degrees, or `0` when the joint is within its constraint.
 *
 * It sums the `overshoot` of every violation {@link validateJointRom} reports,
 * the same check the pose gate runs, so a solver that ranks candidates by this
 * number cannot judge itself by a kinder rule than the gate. A non-finite angle
 * is reported without an overshoot and scores `Infinity`, so it never wins a
 * ranking. A `null` constraint scores `0`.
 *
 * @param joint Clinical angles of one joint; `null` axes are at rest.
 * @param constraint The joint's resolved ROM, or `null` when unconstrained.
 *
 * @evidence contracts/common.md#principled-implementation Reduces the gate's own per-axis and swing-cone violations to one comparable sum, so ordering by it is ordering by the gate's distances; a violation without a measured distance is a non-finite angle, which the sum treats as infinitely far instead of free.
 * @evidence contracts/common.md#clear-and-simple-design Wraps `validateJointRom` instead of restating its limits, so `decomposeJointRotation`'s chart choice and `reachPose`'s candidate scoring read exactly the rule `validatePose` enforces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no tolerance and no special case for any bone or axis; the `Infinity` score is the stated meaning of an unmeasurable violation, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the zero answer, that the gate's check is reused and why, the `Infinity` case, and what `null` means for the constraint and for an axis.
 * @evidence contracts/performance.md#efficient-algorithms Three axis checks plus at most one swing-cone check and a sum over at most four violations, constant per call; the short-lived collector is the gate's own message-building path, accepted so the score cannot drift from the gate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one joint and constraint that coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one `ViolationCollector` holding at most four violations for the duration of the call; it is unreachable after the sum returns, and nothing is retained.
 * @author Samchon
 */
export const jointRomOvershoot: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
) => number = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
): number => {
  if (constraint === null) return 0;
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({ joint, constraint, path: "$candidate", collector });
  return collector.items.reduce(
    // A violation with no overshoot is not a free one. `validateJointRom` omits
    // the measure exactly when the angle is NOT FINITE, which is worse than any
    // distance past a limit and has no distance to report. Scoring it `0` would
    // rank a malformed candidate as perfectly legal and let it win the
    // selection outright, so it is scored as unusable instead.
    (total: number, item: IAutoMovieConstraintViolation): number =>
      total + (item.overshoot ?? Number.POSITIVE_INFINITY),
    0,
  );
};
