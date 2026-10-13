import { ITwoBoneIK } from "./ITwoBoneIK";

const acosDeg = (x: number): number =>
  (Math.acos(Math.min(1, Math.max(-1, x))) * 180) / Math.PI;

/**
 * The closed-form angles of a two-segment chain whose tip reaches a goal at
 * straight-line `distance` from its root, by the law of cosines.
 *
 * `bend` is the interior angle at the mid joint, 180 straight and smaller as
 * the chain folds; `lift` is the angle between the upper segment and the
 * root-to-goal line. The caller orients the chain toward the goal and turns
 * the mid joint and the root by these angles. A distance below
 * `|upper − lower|` or above `upper + lower` is clamped to that bound and
 * `clamped` is set, so the chain fully folds or extends instead of producing
 * `NaN`. When both segments are equal and the goal is at the root, `lift` is 0.
 *
 * Lengths and distance share one unit. Throws when a length is not finite and
 * positive, or the distance is not finite and non-negative.
 *
 * @param upper Root-to-mid segment length, positive.
 * @param lower Mid-to-tip segment length, positive.
 * @param distance Root-to-goal distance, non-negative.
 *
 * @evidence contracts/common.md#principled-implementation The law of cosines on the triangle of the two segments and the clamped distance gives both angles exactly; clamping the distance into `[|upper − lower|, upper + lower]` keeps the triangle valid, and clamping each cosine into [-1, 1] absorbs the rounding that can push a boundary cosine past one; the only remaining degeneracy, a zero distance with equal segments, has no lift direction and answers 0.
 * @evidence contracts/common.md#clear-and-simple-design A scalar solver separate from chain orientation, so `twoBoneChainArticulation` and the playground rigs each orient the chain their own way while sharing these angles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreachable goal is clamped and reported through `clamped` rather than hidden, invalid input throws instead of being coerced, and no limb or length is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what each angle measures and its range, the clamping bounds and flag, the zero-distance answer, the shared unit, and the thrown inputs.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: three validations, two clamped arccosines and a handful of arithmetic operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of three numbers that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned record.
 * @author Samchon
 */
export const solveTwoBoneIK = (
  upper: number,
  lower: number,
  distance: number,
): ITwoBoneIK => {
  validateSegmentLength("upper", upper);
  validateSegmentLength("lower", lower);
  validateDistance(distance);
  const min: number = Math.abs(upper - lower);
  const max: number = upper + lower;
  const clamped: boolean = distance < min || distance > max;
  const d: number = Math.min(Math.max(distance, min), max);
  const bend: number = acosDeg(
    (upper * upper + lower * lower - d * d) / (2 * upper * lower),
  );
  const lift: number =
    d === 0
      ? 0
      : acosDeg((upper * upper + d * d - lower * lower) / (2 * upper * d));
  return { bend, lift, clamped };
};

const validateSegmentLength = (
  label: "upper" | "lower",
  value: number,
): void => {
  if (!Number.isFinite(value))
    throw new Error(
      `two-bone IK ${label} length must be finite, but was ${value}`,
    );
  if (value <= 0)
    throw new Error(
      `two-bone IK ${label} length must be > 0, but was ${value}`,
    );
};

const validateDistance = (distance: number): void => {
  if (!Number.isFinite(distance))
    throw new Error(`two-bone IK distance must be finite, but was ${distance}`);
  if (distance < 0)
    throw new Error(
      `two-bone IK distance must be non-negative, but was ${distance}`,
    );
};
