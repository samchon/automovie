import { IAutoMovieJointPose, IAutoMovieSkeleton } from "@automovie/interface";

import { clampJointRom } from "./clampJointRom";
import { getConstraint } from "./getConstraint";

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
