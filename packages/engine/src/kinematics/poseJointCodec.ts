import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";
import { IAutoMoviePoseRig } from "./IAutoMoviePoseRig";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { jointToQuaternion } from "./jointToQuaternion";
import { skeletonJointAxes } from "./skeletonJointAxes";

/**
 * The two maps between a joint's clinical angles and its bone-local rotation
 * on one rig, for work that must treat a pose's joints as rotations.
 *
 * A joint's `[flexion, abduction, twist]` is an Euler chart of a rotation: at
 * the chart's gimbal (a hanging arm on a T-pose rig, where the shoulder's
 * abduction is 90 degrees from rest) two of the angles turn about one axis,
 * so nearly equal rotations have far apart triples, and a difference or blend
 * taken per angle swings the bone through poses neither side holds. Differences
 * and blends are therefore taken on the rotation, and the result is lowered
 * to angles once.
 *
 * `rotation` is {@link jointToQuaternion} with the rig's axes (a bone's own
 * declaration before the host table, {@link skeletonJointAxes}) and rest
 * frame. `angles` is {@link decomposeJointRotation} with the same two and the
 * bone's effective range of motion ({@link getConstraint}), so of the
 * equivalent triples it returns the one the range admits best, as the limb
 * fits do. Without a rig both use the default basis with rest-relative angles
 * and the principal chart.
 *
 * That holds for a joint free about all three axes. A hinge or a two-axis
 * joint spans a lower-dimensional set of rotations, which a composed rotation
 * leaves, and its angles have no gimbal inside their range; `ball` tells the
 * two apart so a caller keeps such a joint on its own angles.
 *
 * @param rig The rig the angles are read through; the default basis when omitted.
 * @returns The forward and inverse maps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why rotations are used, what each map delegates to and the no-rig reading.
 * @evidence contracts/development/implementation.md#principled-implementation The forward and inverse Euler maps of one convention, with the inverse's chart chosen by the joint's range, never an angle clamp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner pairs the two maps with one set of tables; both bodies are single delegations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is special-cased; a rotation no chart admits keeps its overshoot.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) axes merge and direct declared-range Map construction avoid B temporary entry tuples; conversions and mobility tests remain fixed work, with no per-test mobile closure. Explicit preparation shares construction across actual transition stages; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each codec shares indexed axes and LAST-declared constraint records, retaining existing live rest-frame/constraint reads. An explicit lazy owner can share that codec across source/target velocity and offset capture under one unchanged rig; no conversion result is memoized.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A codec owns one declared-range Map and optional merged axes table, borrowing rig records. A transition may retain that concrete codec for its existing offset lifetime; release the lazy getter after capture and the codec with that offset, with no global rig cache.
 */
export function poseJointCodec(rig?: IAutoMoviePoseRig): poseJointCodec.ICodec {
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    rig === undefined ? {} : skeletonJointAxes(rig.skeleton, rig.jointAxes);
  const declared: Map<AutoMovieHumanoidBone, IAutoMovieJointConstraint | null> =
    new Map();
  for (const bone of rig?.skeleton.bones ?? [])
    declared.set(bone.bone, bone.constraint ?? null);
  return {
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ): IAutoMovieQuaternion =>
      jointToQuaternion(
        { flexion: angles[0], abduction: angles[1], twist: angles[2] },
        axes[bone],
        rig?.restFrames?.[bone],
      ),
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ): [number, number, number] => {
      const a: IAutoMovieResolvedJointAngles = decomposeJointRotation(
        rotation,
        axes[bone],
        rig?.restFrames?.[bone],
        rig === undefined
          ? undefined
          : {
              bone,
              constraint: getConstraint(bone, declared.get(bone) ?? null),
            },
      );
      return [a.flexion, a.abduction, a.twist];
    },
    ball: (bone: AutoMovieHumanoidBone): boolean => {
      if (rig === undefined) return true;
      const c: IAutoMovieJointConstraint | null = getConstraint(
        bone,
        declared.get(bone) ?? null,
      );
      return (
        c === null || (mobile(c.flexion) && mobile(c.abduction) && mobile(c.twist))
      );
    },
  };
}

/** Whether an admitted axis interval has nonzero freedom, preserving null immobility. */
function mobile(range: IAutoMovieAngleRange | null): boolean {
  return range !== null && range.max > range.min;
}

/** One fresh clinical tuple and its bone, preserving the pose's source read order. */
function entry(
  joint: IAutoMovieJointPose,
): [AutoMovieHumanoidBone, [number, number, number]] {
  return [
    joint.bone,
    [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
  ];
}

/**
 * Companion types of {@link poseJointCodec}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents clinical/quaternion conversion, mobility, fresh pose-angle indexing and explicit lazy ownership, including the retained offset's distinct lifetime.
 * @evidence contracts/development/design.md#principled-representation Clinical degrees and unit articulation quaternions describe the same joints; the index retains LAST pose duplicates and a lazy getter owns only one codec's rig metadata.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Velocity and inertialization share the existing conversion/mobility interface, fresh indexing and one lazy constructor instead of repeating three same-rig preparations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface pose/quaternion/bone types, preserves declared constraint precedence and stores no sampled pose, rotation answer or global rig identity.
 */
export namespace poseJointCodec {
  /**
   * Lazily own one actual codec across related velocity reads and offset
   * capture. Keep the rig unchanged through those construction stages.
   * First demand runs the constructor at its caller's original admission
   * stage; a failure is not retained. Release the getter after capture;
   * an offset may retain the concrete codec for its existing lifetime.
   * No pose, quaternion or angle result is cached.
   *
   * @param rig The same rig both sampled states and the offset use.
   * @returns A lazy one-codec getter, without any eager rig read.
   */
  export function prepare(rig?: IAutoMoviePoseRig): () => ICodec {
    let codec: ICodec | undefined;
    return (): ICodec => (codec ??= poseJointCodec(rig));
  }

  /**
   * Fresh clinical tuples indexed in source order, LAST duplicate wins.
   * Null angles keep their clinical-zero reading. The caller owns the map
   * and tuples; nothing is retained. O(J) output and the existing entry array
   * preserve the original map admission, with no per-call mapper closure.
   *
   * @param pose The actual pose whose joint channels are read.
   * @returns Fresh indexed clinical-degree tuples.
   */
  export function index(
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, [number, number, number]> {
    return new Map(pose.joints.map(entry));
  }

  /** The two maps of one rig. */
  export interface ICodec {
    /**
     * A bone's articulation, the rotation applied after its rest rotation,
     * from its clinical `[flexion, abduction, twist]` in degrees.
     */
    rotation: (
      bone: AutoMovieHumanoidBone,
      angles: readonly [number, number, number],
    ) => IAutoMovieQuaternion;

    /**
     * A bone's clinical `[flexion, abduction, twist]` in degrees from its
     * unit articulation.
     */
    angles: (
      bone: AutoMovieHumanoidBone,
      rotation: IAutoMovieQuaternion,
    ) => [number, number, number];

    /**
     * Whether a bone's articulations fill a three-dimensional set of
     * rotations: its effective range of motion is absent or moves all three
     * axes. A hinge or a two-axis joint is not one; a rotation composed from
     * two of its articulations generally leaves the set its angles span, so
     * such a joint is differenced and blended on its own angles. Every bone
     * is one without a rig, where no range is read.
     */
    ball: (bone: AutoMovieHumanoidBone) => boolean;
  }
}
