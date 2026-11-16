import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { clampJointRom } from "./clampJointRom";
import { getConstraint } from "./getConstraint";

/**
 * Clamp one joint using its skeleton override, otherwise the humanoid default table. Unconstrained joints return by identity. This targeted seam lets derived contact/retarget corrections leave authored neighboring joints alone.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Find the first matching skeleton bone and prefer a nonnull override over the humanoid table, returning the original unconstrained joint or a clamped record; swing-twist uses the skeleton's current axis precedence and canonical rest frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A one-joint seam permits selective retarget/contact correction without changing authored neighbors.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing bones retain named-default fallback; this does not establish skeleton membership, identity or physical convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Docs state precedence, borrowed unconstrained result and targeted use, with numerical clamp limitations delegated.
 * @evidence contracts/development/implementation.md#efficient-algorithms First-bone lookup is O(B); only a swing-twist constraint needs the additional O(B) current-axis merge, because box/cone projection never reads that frame. Full-pose callers share their operation's index and axes, followed by the unchanged numerical projection per joint.
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
 * Operation-scoped preparation for {@link clampJointToSkeleton}: either
 * resolve a bone from its skeleton or reuse an operation's existing lookup.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the standalone, resolved-bone and multi-joint preparation entries, their shared constraint/frame semantics and the fixed-input operation scope described on each member.
 * @evidence contracts/development/design.md#principled-representation A one-bone clamp closure holds the effective constraint and any needed clinical frame for one unchanged solve; indexed operations retain the actual first-bone lookup without storing projected answers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Standalone and multi-joint callers share the actual constraint gate and numerical projection; the operation factory also serves repeated full-pose clamps and arm-trajectory FK on one unchanged rig.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new ROM representation, global skeleton cache or cached joint answer is introduced; missing bones retain the named-default constraint policy.
 */
export namespace clampJointToSkeleton {
  /**
   * Prepare actual joint clamps for one unchanged rig operation. The first
   * requested joint builds a first-bone index; each distinct name then reads
   * its constraint and frame once, and every incoming joint is projected.
   *
   * An optional axes table must be the complete result of
   * skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES) for this same operation.
   * Without it, that merge is made only when a constrained joint first needs
   * its frame. Axis admission still occurs inside the actual projection.
   *
   * Metadata setup costs O(B+D), followed by the existing projection per
   * input joint, for B bones and D requested names. The returned function
   * owns at most B first-bone records, D clamp closures with optional lazy
   * swing-twist bases and one axes table;
   * release it when the operation ends, including failure. A later solve
   * creates a new preparation, so no mutable skeleton identity is cached.
   *
   * @param skeleton The rig, unchanged until the returned clamp is released.
   * @param resolvedAxes Its already resolved canonical axes table, when available.
   * @returns A clamp that preserves each unconstrained input joint by identity.
   */
  export function prepare(
    skeleton: IAutoMovieSkeleton,
    resolvedAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
    let bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> | undefined;
    let axes:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined = resolvedAxes;
    const clamps: Map<
      AutoMovieHumanoidBone,
      (joint: IAutoMovieJointPose) => IAutoMovieJointPose
    > = new Map();
    return (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
      if (bones === undefined) {
        bones = new Map();
        for (const bone of skeleton.bones)
          if (!bones.has(bone.bone)) bones.set(bone.bone, bone);
      }
      const name: AutoMovieHumanoidBone = joint.bone;
      let clamp:
        | ((joint: IAutoMovieJointPose) => IAutoMovieJointPose)
          | undefined = clamps.get(name);
      if (clamp === undefined) {
        const constraint: IAutoMovieJointConstraint | null = getConstraint(
          name,
          bones.get(name)?.constraint ?? null,
        );
        clamp = prepareConstraintClamp(
          constraint,
          (): swingTwistRange.IJoint | undefined => {
            if (
              constraint === null ||
              constraint.swingTwist === undefined ||
              constraint.swingTwist === null
            )
              return undefined;
            axes ??= skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES);
            return swingTwistRange.fromAxes(name, axes[name]);
          },
        );
        clamps.set(name, clamp);
      }
      return clamp(joint);
    };
  }

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
   *
   * States the one-bone closure, fixed-input operation scope, skeleton mutation boundary and caller-owned lifetime.
   * Uses the first matching bone for override precedence and the shared private constraint gate, resolving a current skeleton frame only for an actual swing-twist clamp.
   * One first-bone lookup and one shared clamp preparation; numerical projection stays in clampJointRom.
   * Missing bones preserve default ROM, and an unconstrained bone never resolves a swing-twist frame.
   * O(B) lookup and, only for a swing-twist constraint, an O(B) axis merge are paid once per closure; box/cone clamps skip unused axes metadata and later invocations perform the existing projection only.
   * The closure borrows this operation's resolved constraint and frame; a new preparation reads current skeleton contents, including axes replaced on the same bones list.
   * The caller owns one closure borrowing one constraint and frame until its solve ends; no global skeleton cache, task or handle is retained.
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
    return prepareConstraintClamp(
      constraint,
      (): swingTwistRange.IJoint | undefined =>
        constraint === null ||
        constraint.swingTwist === undefined ||
        constraint.swingTwist === null
          ? undefined
          : swingTwistRange.of(bone, skeleton),
    );
  }

  /**
   * Prepare the same one-bone clamp from a caller's first matching bone and
   * frame reader, allowing one pose operation to share its index and axes.
   * The supplied record must belong to bone; undefined preserves named
   * default ROM. The frame reader runs only after the joint is constrained.
   *
   * @param bone The joint's bone name.
   * @param found The first matching skeleton bone, or undefined when absent.
   * @param readRig The frame resolved from that same unchanged skeleton.
   * @returns A clamp for joints of bone, borrowing the resolved constraint and frame.
   *
   * States lookup provenance, absent-bone default behavior, frame-reader ordering and the closure's fixed bone and lifetime.
   * getConstraint owns override/default precedence; an unconstrained joint returns by identity, otherwise the frame is read once and clampJointRom performs each actual projection.
   * This shared preparation separates bone lookup from the unchanged constraint gate and projection used by standalone and full-pose clamps.
   * Does not validate skeleton membership, repair axes or cache a clamped answer; the caller supplies the actual first matching bone and same-skeleton rig reader.
   * Constant preparation apart from the caller's frame reader, then the existing projection for every joint; no bone scan is performed here.
   * Reuses this operation's constraint/frame and a swing-twist frame's lazy basis while preserving every actual projection; no state is shared across solves.
   * One returned clamp owns its optional prepared frame, private reader and one lazy basis plus borrowed constraint/axis/frame records, released with the operation; ordinary box clamps keep no prepared swing basis and a one-shot swing clamp may pay one extra fixed-size wrapper.
   */
  export function resolved(
    bone: IAutoMovieJointPose["bone"],
    found: IAutoMovieBone | undefined,
    readRig: () => swingTwistRange.IJoint | undefined,
  ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      found?.constraint ?? null,
    );
    return prepareConstraintClamp(constraint, readRig);
  }
}

/**
 * Shared constraint gate and closure delegating every projection to clampJointRom.
 * The supplied reader still runs exactly once for a constrained joint; only
 * internal standalone/indexed readers omit their own unused box/cone frames.
 */
function prepareConstraintClamp(
  constraint: IAutoMovieJointConstraint | null,
  readRig: () => swingTwistRange.IJoint | undefined,
): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
  if (constraint === null)
    return (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint;
  const source: swingTwistRange.IJoint | undefined = readRig();
  const rig: swingTwistRange.IJoint | undefined =
    source === undefined ||
    constraint.swingTwist === undefined ||
    constraint.swingTwist === null
      ? source
      : swingTwistRange.prepare(source);
  return (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
    clampJointRom(joint, constraint, rig);
}
