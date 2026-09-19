import { ITwoBoneIK } from "./ITwoBoneIK";

const acosDeg = (x: number): number =>
  (Math.acos(Math.min(1, Math.max(-1, x))) * 180) / Math.PI;

/**
 * Solve a two-bone IK chain (upper + lower segment) reaching toward a goal a
 * straight-line `distance` from the root: the closed-form, deterministic
 * **analytic IK** the engine references (the 80% case: arms, legs), no solver
 * iteration. Returns the mid-joint bend and the upper-segment lift via the law
 * of cosines; the caller orients the chain toward the goal and applies `bend`
 * to the knee/elbow and `lift` to the hip/shoulder.
 *
 * An unreachable goal (nearer than `|upper−lower|` or farther than
 * `upper+lower`) is clamped to the reachable shell and flagged, so the limb
 * fully folds or fully extends rather than producing NaN.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Computes the exact two-link angles inside the chain's measured reach shell.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Implements the deterministic closed-form solve for a bounded reach shell.
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
  const min = Math.abs(upper - lower);
  const max = upper + lower;
  const clamped = distance < min || distance > max;
  const d = Math.min(Math.max(distance, min), max);
  const bend = acosDeg(
    (upper * upper + lower * lower - d * d) / (2 * upper * lower),
  );
  const lift =
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
