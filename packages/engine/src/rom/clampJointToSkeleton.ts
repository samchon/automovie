import { IAutoMovieJointPose, IAutoMovieSkeleton } from "@automovie/interface";
import { getConstraint } from "./getConstraint";
import { clampJointRom } from "./clampJointRom";

/**
 * Clamp one joint against the skeleton's effective ROM: the bone's own
 * `constraint` override when it carries one, otherwise the default humanoid
 * table, the `target-override-then-default-humanoid` precedence
 * {@link retargetHumanoidMotion} names as its ROM policy. A bone with neither
 * passes through unchanged.
 *
 * Exposed separately from {@link clampPose} because a solver that rewrites only
 * the joints it derived (a retarget contact correction) must not clamp the
 * authored joints it left alone.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Applies the bone override before the canonical fallback when enforcing joint limits.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Projects one skeleton joint into its effective ROM.
 * @author Samchon
 */
export const clampJointToSkeleton = (
  joint: IAutoMovieJointPose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieJointPose => {
  const bone = skeleton.bones.find((b) => b.bone === joint.bone);
  const constraint = getConstraint(joint.bone, bone?.constraint ?? null);
  return constraint === null ? joint : clampJointRom(joint, constraint);
};
