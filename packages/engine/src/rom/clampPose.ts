import {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Return a new pose/joint array by applying effective skeleton ROM to each joint. Root and unconstrained joint records remain borrowed; pose/skeleton identity admission and unrestricted multi-turn cone correctness are separate responsibilities.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Map each joint through effective skeleton ROM while preserving pose skeleton id and borrowed root; unconstrained joints retain identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The pose wrapper delegates constraint precedence and angular projection to the one-joint owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint is invented/dropped and root is not repaired; skeleton identity admission and unrestricted multi-turn cone correctness remain outside this mapper.
 * @evidence contracts/development/common.md#meaningful-documentation Docs state new wrapper/array, borrowed root/unchanged joints and effective constraint ownership instead of universal validity.
 * @evidence contracts/development/implementation.md#efficient-algorithms J joints each scan B bones, requiring O(J*B) work plus fixed clamps and O(J) output.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical joint projection is shared, but repeated bone scans remain a reuse limitation rather than a persistent index.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns wrapper/array/new joints and borrows root/unconstrained joints; no native handle or task is held.
 */
export const clampPose: (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
) => IAutoMoviePose = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMoviePose => ({
  skeleton: pose.skeleton,
  root: pose.root,
  joints: pose.joints.map(
    (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      clampJointToSkeleton(joint, skeleton),
  ),
});
