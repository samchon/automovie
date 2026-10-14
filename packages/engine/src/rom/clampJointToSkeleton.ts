import {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointRom } from "./clampJointRom";
import { getConstraint } from "./getConstraint";

/**
 * Clamp one joint using its skeleton override, otherwise the humanoid default table. Unconstrained joints return by identity. This targeted seam lets derived contact/retarget corrections leave authored neighboring joints alone.
 *
 * @evidence contracts/common.md#principled-implementation Find the skeleton bone and prefer a nonnull override over the humanoid table, returning the original unconstrained joint or a new clamped record.
 * @evidence contracts/common.md#clear-and-simple-design A one-joint seam permits selective retarget/contact correction without changing authored neighbors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing bones retain named-default fallback; this does not establish skeleton membership, identity or physical convergence.
 * @evidence contracts/common.md#meaningful-documentation Docs state precedence, borrowed unconstrained result and targeted use, with numerical clamp limitations delegated.
 * @evidence contracts/performance.md#efficient-algorithms B-bone linear lookup plus fixed projection needs O(B) work and at most one result record.
 * @evidence contracts/performance.md#reuse-equivalent-work All consumers share getConstraint precedence; repeated standalone bone lookup remains uncached over mutable skeleton contents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns new joints and borrows unchanged joints/constraints, with no retained index, handle or task.
 */
export const clampJointToSkeleton: (
  joint: IAutoMovieJointPose,
  skeleton: IAutoMovieSkeleton,
) => IAutoMovieJointPose = (
  joint: IAutoMovieJointPose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieJointPose => {
  const bone: IAutoMovieBone | undefined = skeleton.bones.find(
    (b: IAutoMovieBone): boolean => b.bone === joint.bone,
  );
  const constraint: IAutoMovieJointConstraint | null = getConstraint(
    joint.bone,
    bone?.constraint ?? null,
  );
  return constraint === null ? joint : clampJointRom(joint, constraint);
};
