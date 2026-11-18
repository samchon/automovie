import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieClampPose,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { HUMANOID_JOINT_AXES } from "../kinematics/constants/HUMANOID_JOINT_AXES";
import { skeletonJointAxes } from "../kinematics/skeletonJointAxes";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { clampJointRom } from "./clampJointRom";
import { clampJointRomValues } from "./clampJointRomValues";
import { getConstraint } from "./getConstraint";

/** Synchronous joint projection; returned records can alias an unconstrained input. */
type IClamp = (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

/** Only this owner's actual factory callables have no candidate-retaining closure. */
const BORROWABLE: WeakSet<IClamp> = new WeakSet();

/**
 * Clamp one joint using its skeleton override, otherwise the humanoid default table. Unconstrained joints return by identity. This targeted seam lets derived contact/retarget corrections leave authored neighboring joints alone.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Find the first matching skeleton bone and prefer a nonnull override over the humanoid table, returning the original unconstrained joint or a clamped record; swing-twist uses the skeleton's current axis precedence and canonical rest frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A one-joint seam permits selective correction; operation factories share the private constraint gate. borrow recognizes only those actual factory callables for query-owned scratch inputs, keeping arbitrary callbacks on their original fresh-input path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing bones retain named-default fallback; this does not establish skeleton membership, identity or physical convergence.
 * @evidence contracts/development/common.md#meaningful-documentation States precedence, borrowed unconstrained result and targeted use. Companion prose defines fixed-source factory scopes and genuine callable borrowing, including input/output nonretention, possible output aliasing and unknown/wrapped callback fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms First-bone lookup is O(B); only swing-twist needs an O(B) current-axis merge. Full-pose callers share their operation's index/axes before unchanged projection. Factory provenance registration and borrow lookup are constant-time; actual query scratch reuse belongs to the projector, with no measured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All consumers share getConstraint precedence; standalone lookup remains live. Exact factory-callable provenance proves only that its closure stores source metadata, never input/output joints: projection still executes per call. Wrappers/proxies/bound/foreign callables have no registration and receive no borrowing capability.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Factory closures own only their existing constraint/frame/index metadata, never incoming or returned joints. A weak callable set adds no strong population/lifetime; source state releases with its caller-owned function. Unconstrained results may alias the input, so a scratch consumer must copy any retained answer before its next edit. No handle or task is retained.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Standalone/multi-joint callers share constraint/projection owners; borrow gives the actual projector the same factory callable only when private producer provenance proves no candidate retention.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No user flag, new ROM representation, global skeleton cache or cached joint answer is introduced. Only actual factory functions are weakly registered, unknown/wrapped callables remain unsupported by borrow, and missing bones retain named-default constraints.
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
   * @returns A clamp that preserves each unconstrained input joint by identity, carrying its angle-taking form (IPrepared.values).
   */
  export function prepare(
    skeleton: IAutoMovieSkeleton,
    resolvedAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  ): clampJointToSkeleton.IPrepared {
    let bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> | undefined;
    let axes:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined = resolvedAxes;
    const clamps: Map<AutoMovieHumanoidBone, IPair> = new Map();
    const pair = (name: AutoMovieHumanoidBone): IPair => {
      if (bones === undefined) {
        bones = new Map();
        for (const bone of skeleton.bones)
          if (!bones.has(bone.bone)) bones.set(bone.bone, bone);
      }
      let found: IPair | undefined = clamps.get(name);
      if (found === undefined) {
        const constraint: IAutoMovieJointConstraint | null = getConstraint(
          name,
          bones.get(name)?.constraint ?? null,
        );
        found = prepareConstraintPair(
          constraint,
          (): IAutoMovieJointRotationFrame | undefined => {
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
        clamps.set(name, found);
      }
      return found;
    };
    // The clamp carries its angle-taking form as its own member (`values`):
    // the same clamps read from a joint's bone and three clinical angles,
    // for a writer that has the angles, each returning the record the
    // record clamp returns for the record of those values (an unconstrained
    // bone's a fresh record of them, where the record clamp hands its input
    // back), on the same per-bone constraints and frames.
    return Object.assign(
      ownClamp(
        (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
          pair(joint.bone).joint(joint),
      ),
      {
        values: (
          bone: AutoMovieHumanoidBone,
          flexion: number | null,
          abduction: number | null,
          twist: number | null,
        ): IAutoMovieJointPose =>
          pair(bone).values(bone, flexion, abduction, twist),
      },
    );
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
      (): IAutoMovieJointRotationFrame | undefined =>
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
   * One returned clamp owns its optional prepared frame, private readers and at most one admitted-axis reference and one swing basis plus borrowed constraint/axis/frame records, released with the operation; ordinary box clamps keep no prepared swing basis and a one-shot swing clamp pays the fixed-size wrapper and its three closures.
   */
  export function resolved(
    bone: IAutoMovieJointPose["bone"],
    found: IAutoMovieBone | undefined,
    readRig: () => IAutoMovieJointRotationFrame | undefined,
  ): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      bone,
      found?.constraint ?? null,
    );
    return prepareConstraintClamp(constraint, readRig);
  }

  /**
   * Borrow this owner's exact factory callable for synchronous scratch inputs.
   * The returned function is the original callable, with no replacement or
   * extra invocation. Its closure stores only fixed source metadata and never
   * an input or result joint. Unconstrained projection can return the input
   * itself; copy a selected/retained result before editing that scratch again.
   *
   * Private weak registration comes only from of/resolved/prepare production.
   * Unknown, wrapped, proxied or bound callbacks return undefined, so their
   * original fresh-input/callback behavior remains the consumer's fallback.
   * This lookup certifies no ROM, matching domain, projection outcome or input
   * validity. It costs constant work, stores no joint and retains no callable
   * strongly; release the borrowed function with its owning operation.
   */
  export function borrow(clamp: IClamp): IClamp | undefined {
    return BORROWABLE.has(clamp) ? clamp : undefined;
  }

  /** The interface contract (`IAutoMovieClampPose.IJoints`): the record clamp with its angle-taking form as its own member, carried by the pose projection `clampPose.prepare` builds. */
  export type IPrepared = IAutoMovieClampPose.IJoints;
}

/**
 * Shared constraint gate and closure delegating every projection to clampJointRom.
 * The supplied reader still runs exactly once for a constrained joint; only
 * internal standalone/indexed readers omit their own unused box/cone frames.
 */
function prepareConstraintClamp(
  constraint: IAutoMovieJointConstraint | null,
  readRig: () => IAutoMovieJointRotationFrame | undefined,
): (joint: IAutoMovieJointPose) => IAutoMovieJointPose {
  return ownClamp(prepareConstraintPair(constraint, readRig).joint);
}

/** One bone's record clamp and its angle-taking form, sharing one constraint and one prepared frame read once. */
function prepareConstraintPair(
  constraint: IAutoMovieJointConstraint | null,
  readRig: () => IAutoMovieJointRotationFrame | undefined,
): IPair {
  if (constraint === null)
    return {
      joint: (joint: IAutoMovieJointPose): IAutoMovieJointPose => joint,
      values: (
        bone: AutoMovieHumanoidBone,
        flexion: number | null,
        abduction: number | null,
        twist: number | null,
      ): IAutoMovieJointPose => ({ bone, flexion, abduction, twist }),
    };
  const source: IAutoMovieJointRotationFrame | undefined = readRig();
  const rig: IAutoMovieJointRotationFrame | undefined =
    source === undefined ||
    constraint.swingTwist === undefined ||
    constraint.swingTwist === null
      ? source
      : swingTwistRange.prepare(source);
  return {
    joint: (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
      clampJointRom(joint, constraint, rig),
    values: (
      bone: AutoMovieHumanoidBone,
      flexion: number | null,
      abduction: number | null,
      twist: number | null,
    ): IAutoMovieJointPose =>
      clampJointRomValues(bone, flexion, abduction, twist, constraint, rig),
  };
}

/** A joint clamp read from a bone and its three clinical angles. */
type IValues = (
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
) => IAutoMovieJointPose;

/** One bone's two clamp forms. */
interface IPair {
  /** The record clamp. */
  joint: IClamp;

  /** The angle-taking form. */
  values: IValues;
}

/** Register only actual source-only factory closures, without wrapping their calls. */
function ownClamp(clamp: IClamp): IClamp {
  BORROWABLE.add(clamp);
  return clamp;
}
