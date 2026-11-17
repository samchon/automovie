import {
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  type IAutoMovieJointRotationFrame,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { swingTwistRange } from "../kinematics/swingTwistRange";
import { clampJointRom } from "./clampJointRom";
import { getConstraint } from "./getConstraint";

/**
 * Clamp one joint using its skeleton override, otherwise the humanoid default table. Unconstrained joints return by identity. This targeted seam lets derived contact/retarget corrections leave authored neighboring joints alone.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Find the skeleton bone and prefer a nonnull override over the humanoid table, returning the original unconstrained joint or a new clamped record; a swing-twist joint is clamped in the frame the skeleton resolves for the bone (`swingTwistRange.of`).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A one-joint seam permits selective retarget/contact correction without changing authored neighbors.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing bones retain named-default fallback; this does not establish skeleton membership, identity or physical convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Docs state precedence, borrowed unconstrained result and targeted use, with numerical clamp limitations delegated.
 * @evidence contracts/development/implementation.md#efficient-algorithms B-bone linear lookup plus fixed projection needs O(B) work and at most one result record.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All consumers share getConstraint precedence; repeated standalone bone lookup remains uncached over mutable skeleton contents.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns new joints and borrows unchanged joints/constraints, with no retained index, handle or task.
 */
export function clampJointToSkeleton(
  joint: IAutoMovieJointPose,
  skeleton: IAutoMovieSkeleton,
): IAutoMovieJointPose {
  return clampJointToSkeleton.of(joint.bone, skeleton)(joint);
}

/**
 * Companion of {@link clampJointToSkeleton}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the companion holds.
 * @evidence contracts/development/design.md#principled-representation One bone's clamp, resolved once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The clamp is `clampJointToSkeleton`'s own, with its lookup taken out of the call.
 */
export namespace clampJointToSkeleton {
  /**
   * One bone's clamp under a skeleton, its override or the humanoid table and
   * its swing-twist frame resolved once, for a caller that clamps the same
   * bone many times within one solve (a sweep's candidates): each call clamps
   * exactly as `clampJointToSkeleton` does with the skeleton as it stood when
   * the clamp was made. Nothing is kept beyond the closure, since a skeleton's
   * contents may change between solves.
   *
   * @param bone The bone.
   * @param skeleton The skeleton.
   * @returns The clamp of a joint of that bone.
   */
  export function of(
    bone: IAutoMovieJointPose["bone"],
    skeleton: IAutoMovieSkeleton,
  ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
    const found: IAutoMovieBone | undefined = skeleton.bones.find(
      (b: IAutoMovieBone): boolean => b.bone === bone,
    );
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      found?.constraint ?? null,
    );
    if (constraint === null)
      return (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint;

    // A joint gated by swing and twist is read in the frame this skeleton
    // resolves for its bone, the frame its angles are written in.
    const rig: IAutoMovieJointRotationFrame | undefined = swingTwistRange.of(
      bone,
      skeleton,
    );
    return (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      clampJointRom(joint, constraint, rig);
  }
}
