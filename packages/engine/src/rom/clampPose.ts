import type { IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Return a new pose/joint array by applying effective skeleton ROM to each joint. Root and unconstrained joint records remain borrowed; pose/skeleton identity admission and unrestricted multi-turn cone correctness are separate responsibilities.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Map joints in source order through the existing one-joint clamp, indexed by the first matching skeleton bone to preserve find semantics; swing-twist axes retain skeletonJointAxes' last-declared precedence and unconstrained joints retain identity. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single-call entry delegates to prepare, whose shared joint-clamp factory owns first-bone indexing and lazy frame/constraint lookup. joints lends that actual factory's same one-joint callable to a matching operation; numerical projection remains in clampJointRom and every pose wrapper and joint array is fresh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint is invented/dropped and root is not repaired; skeleton identity admission and unrestricted multi-turn cone correctness remain outside this mapper. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
 * @evidence contracts/development/common.md#meaningful-documentation States new wrapper/array, borrowed root/unconstrained joints and admission limits; implementation answers identify first-bone constraint precedence and current per-call rig metadata. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
 * @evidence contracts/development/implementation.md#efficient-algorithms For J joints and B bones, first-bone indexing and at most one axis merge plus per-name clamp lookup cost O(B+J) metadata work, followed by the same numerical projection per joint; temporary storage is O(B+D) for D distinct joint names, plus O(J) output. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each distinct bone's constraint and frame only within this synchronous pure-data pose operation; a later call rebuilds from current skeleton contents, while repeated same-name joints still receive separate actual projections. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The index, optional axes table and at most D clamp closures are operation-local and released on return or failure; the caller owns wrapper/array/new joints and borrows root/unconstrained joints, with no global skeleton cache, handle or task. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves repeated clamps before and after transition/contact work, and its joints member is the same actual joint owner, read by differential kinematics in that unchanged operation. The standalone function retains its existing two-argument API.
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
   * @returns A full-pose clamp borrowing only operation-scoped rig metadata, carrying its one-joint clamp (`IPrepared.joints`) and that clamp's angle-taking form (`IPrepared.values`) as its own members.
   */
  export function prepare(
    skeleton: IAutoMovieSkeleton,
  ): IPrepared {
    const clamp: clampJointToSkeleton.IPrepared =
      clampJointToSkeleton.prepare(skeleton);
    const project: (pose: IAutoMoviePose) => IAutoMoviePose = (pose: IAutoMoviePose): IAutoMoviePose => ({
      skeleton: pose.skeleton,
      root: pose.root,
      joints: pose.joints.map(clamp),
    });

    // The projection carries the joint clamp it maps and that clamp's
    // angle-taking form as its own members: a borrower that holds the
    // projection reads them, nothing is looked up.
    return Object.assign(project, { joints: clamp, values: clamp.values });
  }

  /**
   * A prepared pose projection: the pose clamp itself, with its one-joint
   * clamp (`joints`, the clamp every joint of a pose goes through) and that
   * clamp's angle-taking form (`values`: a joint's record made in range from
   * its bone and three clinical angles, the record the joint clamp gives for
   * the record of those values) as its own members.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call, both members and what they return.
   * @evidence contracts/development/design.md#principled-representation One prepared projection with its pose entry, its one-joint entry and its angle entry on the same per-bone metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by prepare; the members serve differential kinematics (`joints`) and a posture's assembly (`values`) of the body that holds the projection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are made with the projection, not looked up; no answer is held.
   */
  export interface IPrepared {
    /** The pose clamp. */
    (pose: IAutoMoviePose): IAutoMoviePose;

    /** The one-joint clamp the pose clamp maps every joint through. */
    joints: clampJointToSkeleton.IPrepared;

    /** The joint clamp's angle-taking form. */
    values: clampJointToSkeleton.IPrepared["values"];
  }
}