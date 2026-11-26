import type { IAutoMovieTwoBoneIK } from "@automovie/interface";

/**
 * The closed-form angles of a two-segment chain whose tip reaches a goal at
 * straight-line `distance` from its root, by the law of cosines.
 *
 * `bend` is the interior angle at the mid joint, 180 straight and smaller as
 * the chain folds; `lift` is the angle between the upper segment and the
 * root-to-goal line. The caller orients the chain toward the goal and turns the
 * mid joint and the root by these angles. A distance below `|upper − lower|` or
 * above `upper + lower` is clamped to that bound and `clamped` is set, so the
 * chain fully folds or extends instead of producing `NaN`. When both segments
 * are equal and the goal is at the root, `lift` is 0.
 *
 * Lengths and distance share one unit. Throws when a length is not finite and
 * positive, the distance is not finite and non-negative, or relative side
 * products cannot be represented after common rescaling. Extreme common units
 * are rescaled before squaring; ordinary lengths retain their arithmetic
 * order.
 *
 * @param upper Root-to-mid segment length, positive.
 * @param lower Mid-to-tip segment length, positive.
 * @param distance Root-to-goal distance, non-negative.
 */
export function solveTwoBoneIK(
  upper: number,
  lower: number,
  distance: number,
): IAutoMovieTwoBoneIK {
  validateSegmentLength("upper", upper);
  validateSegmentLength("lower", lower);
  validateDistance(distance);
  const min: number = Math.abs(upper - lower);
  const max: number = upper + lower;
  const clamped: boolean = distance < min || distance > max;
  let d: number = Math.min(Math.max(distance, min), max);
  const nonzeroDistance: boolean = d !== 0;
  const magnitude: number = Math.max(upper, lower, d);
  if (magnitude < 2 ** -511 || magnitude > 2 ** 510) {
    upper /= magnitude;
    lower /= magnitude;
    d /= magnitude;
  }
  if (upper * lower === 0 || (nonzeroDistance && (d === 0 || upper * d === 0)))
    throw new Error("two-bone IK side ratios exceed represented precision.");
  const bend: number = acosDeg(
    (upper * upper + lower * lower - d * d) / (2 * upper * lower),
  );
  const lift: number =
    d === 0
      ? 0
      : acosDeg((upper * upper + d * d - lower * lower) / (2 * upper * d));
  return { bend, lift, clamped };
}

function acosDeg(x: number): number {
  return (Math.acos(Math.min(1, Math.max(-1, x))) * 180) / Math.PI;
}

const validateSegmentLength: (
  label: "upper" | "lower",
  value: number,
) => void = (label: "upper" | "lower", value: number): void => {
  if (value <= 0)
    throw new Error(
      `two-bone IK ${label} length must be > 0, but was ${value}`,
    );
};

const validateDistance: (distance: number) => void = (
  distance: number,
): void => {
  if (distance < 0)
    throw new Error(
      `two-bone IK distance must be non-negative, but was ${distance}`,
    );
};
