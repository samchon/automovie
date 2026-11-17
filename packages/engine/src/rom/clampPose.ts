import {
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Return a new pose/joint array by applying effective skeleton ROM to each joint. Root and unconstrained joint records remain borrowed; pose/skeleton identity admission and unrestricted multi-turn cone correctness are separate responsibilities.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Map joints in source order through the existing one-joint clamp, indexed by the first matching skeleton bone to preserve find semantics; swing-twist axes retain skeletonJointAxes' last-declared precedence and unconstrained joints retain identity. Member facts: joints: The actual pose factory records its existing one-joint callable. Weak producer membership lends that same numerical owner without guessing from function properties or a supplied flag; the lender still proves its matching unchanged domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single-call entry delegates to prepare, whose shared joint-clamp factory owns first-bone indexing and lazy frame/constraint lookup. joints lends that actual factory's same one-joint callable to a matching operation; numerical projection remains in clampJointRom and every pose wrapper and joint array is fresh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint is invented/dropped and root is not repaired; skeleton identity admission and unrestricted multi-turn cone correctness remain outside this mapper. Member facts: joints: Unknown, wrapped, proxied and bound functions have no registration. Lookup invokes no source, getter or candidate, and every borrowed joint still runs its original projection; callable provenance is no domain or input-validity certificate.
 * @evidence contracts/development/common.md#meaningful-documentation States new wrapper/array, borrowed root/unconstrained joints and admission limits; implementation answers identify first-bone constraint precedence and current per-call rig metadata. Member facts: joints: Defines factory-only provenance, no-invocation lookup, unchanged-operation/domain responsibility, unsupported-function fallback and borrowed callable lifetime.
 * @evidence contracts/development/implementation.md#efficient-algorithms For J joints and B bones, first-bone indexing and at most one axis merge plus per-name clamp lookup cost O(B+J) metadata work, followed by the same numerical projection per joint; temporary storage is O(B+D) for D distinct joint names, plus O(J) output. Member facts: joints: Constant weak lookup adds no query allocation and permits the existing index/frames to serve actual Jacobian projection; gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each distinct bone's constraint and frame only within this synchronous pure-data pose operation; a later call rebuilds from current skeleton contents, while repeated same-name joints still receive separate actual projections. Member facts: joints: Borrows the exact existing source-metadata closure within its original unchanged operation, never a pose, projected joint, score or prior answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The index, optional axes table and at most D clamp closures are operation-local and released on return or failure; the caller owns wrapper/array/new joints and borrows root/unconstrained joints, with no global skeleton cache, handle or task. Member facts: joints: One weak source key holds an already owned callable; no strong source-function population, candidate, history or external handle is introduced, and borrowers release it with the operation.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves repeated clamps before and after transition/contact work, and joints lends its same actual joint owner to differential kinematics in that unchanged operation. The standalone function retains its existing two-argument API.
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
  ): IPrepared {
    const clamp: clampJointToSkeleton.IPrepared =
      clampJointToSkeleton.prepare(skeleton);
    const project: (pose: IAutoMoviePose) => IAutoMoviePose = (pose: IAutoMoviePose): IAutoMoviePose => ({
      skeleton: pose.skeleton,
      root: pose.root,
      joints: pose.joints.map(clamp),
    });
    // The projection carries its joint clamp's angle-taking form as its own
    // member, for a writer that has a joint's angles (a posture's assembly).
    const prepared: IPrepared = Object.assign(project, { values: clamp.values });
    JOINTS.set(prepared, clamp);
    return prepared;
  }

  /**
   * Borrow the actual one-joint owner of a genuine prepared pose projection.
   * The lender must still prove the matching unchanged rig and operation;
   * callable provenance alone proves neither domain nor input validity.
   * Unknown, wrapped, copied, proxied or bound functions return undefined.
   *
   * @param source The pose projection issued by this factory, if genuine.
   * @returns Its original one-joint clamp, without invoking either callable, or undefined.
   *
   * One private weak lookup links the actual producer's existing joint
   * callable to this borrower, without invoking a source or reading metadata.
   * Every numerical clamp still runs. Only source-only metadata is shared;
   * no candidate, projected result, strong source population or handle is
   * retained, and the borrower releases the callable with its operation.
   */
  export function joints(
    source: ReturnType<typeof prepare>,
  ): ReturnType<typeof clampJointToSkeleton.prepare> | undefined {
    return JOINTS.get(source);
  }

  /**
   * A prepared pose projection: the pose clamp itself, with its joint
   * clamp's angle-taking form as its own member
   * (clampJointToSkeleton.IPrepared.values): a joint's record made in range
   * from its bone and three clinical angles, the record the joint clamp
   * gives for the record of those values, without that record being made
   * first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call, the member and what the member returns.
   * @evidence contracts/development/design.md#principled-representation One prepared projection with its pose entry and its one-joint angle entry on the same per-bone metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by prepare; the member serves a posture's assembly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The member is made with the projection, not looked up; no answer is held.
   */
  export interface IPrepared {
    /** The pose clamp. */
    (pose: IAutoMoviePose): IAutoMoviePose;

    /** The joint clamp's angle-taking form. */
    values: clampJointToSkeleton.IPrepared["values"];
  }
}

/** Only the actual pose factory registers its existing source-only joint callable. */
const JOINTS: WeakMap<ReturnType<typeof clampPose.prepare>, ReturnType<typeof clampJointToSkeleton.prepare>> = new WeakMap();
