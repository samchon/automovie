import {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Return a new pose/joint array by applying effective skeleton ROM to each joint. Root and unconstrained joint records remain borrowed; pose/skeleton identity admission and unrestricted multi-turn cone correctness are separate responsibilities.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Map joints in source order through the existing one-joint clamp, indexed by the first matching skeleton bone to preserve find semantics; swing-twist axes retain skeletonJointAxes' last-declared precedence and unconstrained joints retain identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single-call entry delegates to prepare, whose shared joint-clamp factory owns first-bone indexing and lazy frame/constraint lookup; numerical projection remains in clampJointRom and every output wrapper and joint array is fresh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint is invented/dropped and root is not repaired; skeleton identity admission and unrestricted multi-turn cone correctness remain outside this mapper.
 * @evidence contracts/development/common.md#meaningful-documentation States new wrapper/array, borrowed root/unconstrained joints and admission limits; implementation answers identify first-bone constraint precedence and current per-call rig metadata.
 * @evidence contracts/development/implementation.md#efficient-algorithms For J joints and B bones, first-bone indexing and at most one axis merge plus per-name clamp lookup cost O(B+J) metadata work, followed by the same numerical projection per joint; temporary storage is O(B+D) for D distinct joint names, plus O(J) output.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each distinct bone's constraint and frame only within this synchronous pure-data pose operation; a later call rebuilds from current skeleton contents, while repeated same-name joints still receive separate actual projections.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The index, optional axes table and at most D clamp closures are operation-local and released on return or failure; the caller owns wrapper/array/new joints and borrows root/unconstrained joints, with no global skeleton cache, handle or task.
 */
export function clampPose(
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMoviePose {
  return clampPose.prepare(skeleton)(pose);
}

/**
 * Full-pose projection with metadata shared only within one unchanged rig operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged-rig operation boundary, actual repeated projection, fresh outputs and caller-owned preparation lifetime on prepare.
 * @evidence contracts/development/design.md#principled-representation A pose-clamp closure shares only first-bone and clinical-frame metadata; each call still maps every input joint through the existing numerical projection in order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One preparation entry serves repeated clamps before and after transition/contact work, while the standalone function retains its existing two-argument API.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, projected answer or mutable-skeleton identity cache is stored; changed rig dependencies require a new preparation.
 */
export namespace clampPose {
  /**
   * Prepare the metadata of repeated full-pose clamps during one operation.
   * The skeleton and its records must stay unchanged until this function is
   * released; every pose's numerical projection still runs, including when a
   * caller intentionally clamps an earlier clamp's result again.
   *
   * The shared joint owner lazily indexes B bones and prepares D requested
   * names once. Each call still costs O(J) projections and creates a fresh
   * wrapper and joint array, borrowing its root and unconstrained records.
   * The caller releases the closure on completion or failure; no pose or
   * projected result is retained between calls.
   *
   * @param skeleton The unchanged rig used by every pose of this operation.
   * @returns A full-pose clamp borrowing only operation-scoped rig metadata.
   */
  export function prepare(
    skeleton: IAutoMovieSkeleton,
  ): (pose: IAutoMoviePose) => IAutoMoviePose {
    const clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
      clampJointToSkeleton.prepare(skeleton);
    return (pose: IAutoMoviePose): IAutoMoviePose => ({
      skeleton: pose.skeleton,
      root: pose.root,
      joints: pose.joints.map(clamp),
    });
  }
}
