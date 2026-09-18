import { IAutoMovieAngleRange, IAutoMovieJointConstraint, IAutoMovieJointPose } from "@automovie/interface";
import { swingConeBlend } from "./swingConeBlend";

/**
 * Clamp one joint's articulation into its anatomical range of motion, the
 * **enforce** face of {@link validateJointRom}'s **detect** face (the core
 * model's `ClampOutcome`: clamp and validate are one calculation).
 *
 * Each axis is pulled to the nearest bound of its `[min, max]`; an axis the
 * constraint marks `null` (the joint cannot move that way) is forced to `0`,
 * just as a physics hinge refuses the disallowed degrees of freedom. A `null`
 * angle (axis left at rest) stays `null`.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Projects one joint into its declared effective ROM.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Enforces the validator's effective ROM graph during projection.
 * @author Samchon
 */
export const clampJointRom = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
): IAutoMovieJointPose => {
  const flexion = clampAxis(joint.flexion, constraint.flexion);
  const abduction = clampAxis(joint.abduction, constraint.abduction);
  const twist = clampAxis(joint.twist, constraint.twist);
  // Ball-joint swing cone: pull a corner pose back onto the cone. The cone is a
  // COUPLING between the two axes, not a per-axis check, so a resting (`null`)
  // axis is not exempt from it. It contributes its actual rotation, 0, exactly
  // as the renderer reads it (`jointToQuaternion`'s `?? 0`). Gating the cone on
  // both axes being non-null let `{flexion:150, abduction:null}` keep an angle
  // its identical twin `{flexion:150, abduction:0}` was clamped out of (#1245).
  if (typeof constraint.swingDeg === "number") {
    const f = flexion ?? 0;
    const a = abduction ?? 0;
    // Pull toward the box point nearest neutral rather than toward neutral
    // itself: for a box that excludes neutral, shrinking toward the origin
    // leaves the box (#1245). A resting axis anchors at its own rest, 0.
    const anchorF = flexion === null ? 0 : nearestNeutral(constraint.flexion);
    const anchorA =
      abduction === null ? 0 : nearestNeutral(constraint.abduction);
    const t = swingConeBlend(f, a, anchorF, anchorA, constraint.swingDeg);
    const blend = (value: number, anchor: number): number =>
      anchor + (value - anchor) * t;
    return {
      bone: joint.bone,
      // A resting axis stays resting: blending 0 toward its own 0 rest is 0.
      flexion: flexion === null ? null : blend(f, anchorF),
      abduction: abduction === null ? null : blend(a, anchorA),
      twist,
    };
  }
  return { bone: joint.bone, flexion, abduction, twist };
};

/**
 * The point of `allowed` closest to neutral: neutral itself when the range
 * brackets it, else the nearer bound. This is the swing cone's pull target: the
 * joint's most-retracted reachable articulation on that axis.
 */
const nearestNeutral = (allowed: IAutoMovieAngleRange | null): number =>
  allowed === null
    ? 0
    : allowed.min > 0
      ? allowed.min
      : allowed.max < 0
        ? allowed.max
        : 0;

const clampAxis = (
  angle: number | null,
  allowed: IAutoMovieAngleRange | null,
): number | null => {
  if (angle === null) return null;
  if (allowed === null) return 0; // immobile axis: forced back to neutral
  const finiteAngle = Number.isFinite(angle) ? angle : 0;
  return finiteAngle < allowed.min
    ? allowed.min
    : finiteAngle > allowed.max
      ? allowed.max
      : finiteAngle;
};

/**
 * The point of `allowed` closest to neutral: neutral itself when the range
 * brackets it, else the nearer bound. This is the swing cone's pull target: the
 * joint's most-retracted reachable articulation on that axis.
 */
const nearestNeutral = (allowed: IAutoMovieAngleRange | null): number =>
  allowed === null
    ? 0
    : allowed.min > 0
      ? allowed.min
      : allowed.max < 0
        ? allowed.max
        : 0;
