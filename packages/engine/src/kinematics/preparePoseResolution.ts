import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { resolvePoseBone } from "./resolvePoseBone";

/** An operation's two pure FK computations, with the traversal owned by resolvePose. */
interface IReader {
  /** Admit every authored record in order, sharing only a completed identical conversion. */
  joint(
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion;

  /** Return a fresh bone record; identical local and parent scalar inputs share only computation. */
  bone(
    bone: IAutoMovieBone,
    parentRotation: IAutoMovieQuaternion,
    parentPosition: IAutoMovieVector3,
    articulation: IAutoMovieQuaternion,
  ): IAutoMovieResolvedBone;
}

/** A successful authored conversion, isolated from later input edits. */
interface IJointReading {
  /** Clinical values and each axis frame's sign/neutral, including absent values. */
  values: readonly (number | null | undefined)[];

  /** A supplied flexion entry differs from absence even when it lacks valid scalar fields. */
  flexionFrame: boolean;

  /** The same presence distinction for the abduction mapping. */
  abductionFrame: boolean;

  /** The same presence distinction for the twist mapping. */
  twistFrame: boolean;

  /** Frozen normalized basis returned by the common admission owner. */
  basis: IAutoMovieJointAxes;

  /** Private composition snapshot, copied before every joint or bone caller can observe it. */
  rotation: IAutoMovieQuaternion;
}

/** Last resolved dependency tuple and private result scalars for one rig bone. */
interface IBoneReading {
  /** Eighteen rest/articulation/parent scalars, followed by local quaternion, world position and world quaternion. */
  values: readonly number[];
}

/**
 * Share exact FK work within one synchronous motion evaluation, such as a
 * fit's source, zeroed and reference poses or its fixed weapon-stop reads.
 * The owner releases this reader when that evaluation ends.
 * Every authored record and reachable bone still passes through resolvePose
 * in the original order. Input edits invalidate matching scalar dependencies;
 * changed topology still requires an index of the same current skeleton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the synchronous operation lifetime, full ordered admission, scalar invalidation and fresh public output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's joint conversion is determined by its actual clinical values, normalized basis and affine clinical frames, including a cloned record with identical values. World-frame reuse requires identical rest, articulation and parent-frame scalars, so changed ancestors propagate through the original parent-first recurrence and resolvePoseBone keeps its arithmetic grouping.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure resolvePose owns ordered admission and tree traversal, resolvePoseBone owns one physical composition, and this reader alone owns the operation's successful dependency snapshots.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact scalar and frame-presence checks distinguish absent mappings from malformed empty/null entries. Axes retain undefined-only defaults and failed conversions are not stored. Every overwritten record is visited, missing articulation remains identity, and malformed transform records reach the original FK owner rather than fail inside a cache key; no target, search or callback is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each visited joint or bone compares a fixed-size tuple. Unchanged joints avoid three axis-angle compositions and two products; unchanged bones avoid two products, a vector rotation and an addition. Full scans, fresh outputs and miss-side private snapshot allocation remain; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only completed same-valued dependencies are shared across distinct full poses, including newly cloned mirror or layer records. Scalar snapshots detect joint/frame/root/rest edits; changed duplicate joint values miss normally, and private result scalars isolate later reads from output mutation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One last successful joint dependency/result and one last world-frame dependency/result per bone name belong to this synchronous reader, O(B) for visited identities. No joint or pose record, result history, global collection, resource handle or task is held; cloned records do not add entries.
 */
export function preparePoseResolution(): IReader {
  const joints: Map<AutoMovieHumanoidBone, IJointReading> = new Map();
  const bones: Map<AutoMovieHumanoidBone, IBoneReading> = new Map();
  return {
    joint: (
      joint: IAutoMovieJointPose,
      axes: IAutoMovieJointAxes | undefined,
      frame: IAutoMovieRestFrame | undefined,
    ): IAutoMovieQuaternion => {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        axes === undefined ? DEFAULT_JOINT_AXES : axes,
        "jointToQuaternion axes",
      );
      const known: IJointReading | undefined = joints.get(joint.bone);
      if (
        known !== undefined &&
        known.basis === basis &&
        Object.is(known.values[0], joint.flexion) &&
        Object.is(known.values[1], joint.abduction) &&
        Object.is(known.values[2], joint.twist) &&
        known.flexionFrame === (frame?.flexion !== undefined) &&
        known.abductionFrame === (frame?.abduction !== undefined) &&
        known.twistFrame === (frame?.twist !== undefined) &&
        Object.is(known.values[3], frame?.flexion?.sign) &&
        Object.is(known.values[4], frame?.flexion?.neutral) &&
        Object.is(known.values[5], frame?.abduction?.sign) &&
        Object.is(known.values[6], frame?.abduction?.neutral) &&
        Object.is(known.values[7], frame?.twist?.sign) &&
        Object.is(known.values[8], frame?.twist?.neutral)
      )
        return { ...known.rotation };
      const rotation: IAutoMovieQuaternion = jointToQuaternionOnBasis(
        joint,
        basis,
        frame,
      );
      joints.set(joint.bone, {
        basis,
        rotation: { ...rotation },
        flexionFrame: frame?.flexion !== undefined,
        abductionFrame: frame?.abduction !== undefined,
        twistFrame: frame?.twist !== undefined,
        values: [
          joint.flexion,
          joint.abduction,
          joint.twist,
          frame?.flexion?.sign,
          frame?.flexion?.neutral,
          frame?.abduction?.sign,
          frame?.abduction?.neutral,
          frame?.twist?.sign,
          frame?.twist?.neutral,
        ],
      });
      return rotation;
    },
    bone: (
      bone: IAutoMovieBone,
      parentRotation: IAutoMovieQuaternion,
      parentPosition: IAutoMovieVector3,
      articulation: IAutoMovieQuaternion,
    ): IAutoMovieResolvedBone => {
      const known: IBoneReading | undefined = bones.get(bone.bone);
      if (
        known !== undefined &&
        sameBone(
          known.values,
          bone,
          parentRotation,
          parentPosition,
          articulation,
        )
      )
        return copyBone(bone.bone, known.values);
      const resolved: IAutoMovieResolvedBone = resolvePoseBone(
        bone,
        parentRotation,
        parentPosition,
        articulation,
      );
      bones.set(bone.bone, {
        values: [
          bone.rest.rotation.x,
          bone.rest.rotation.y,
          bone.rest.rotation.z,
          bone.rest.rotation.w,
          bone.rest.translation.x,
          bone.rest.translation.y,
          bone.rest.translation.z,
          articulation.x,
          articulation.y,
          articulation.z,
          articulation.w,
          parentRotation.x,
          parentRotation.y,
          parentRotation.z,
          parentRotation.w,
          parentPosition.x,
          parentPosition.y,
          parentPosition.z,
          resolved.localRotation.x,
          resolved.localRotation.y,
          resolved.localRotation.z,
          resolved.localRotation.w,
          resolved.worldPosition.x,
          resolved.worldPosition.y,
          resolved.worldPosition.z,
          resolved.worldRotation.x,
          resolved.worldRotation.y,
          resolved.worldRotation.z,
          resolved.worldRotation.w,
        ],
      });
      return resolved;
    },
  };
}

/** Match actual FK inputs, including signed zero, without trusting mutable object identity. */
function sameBone(
  values: readonly number[],
  bone: IAutoMovieBone,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  articulation: IAutoMovieQuaternion,
): boolean {
  // A malformed record must reach the original FK owner, whose operation
  // order determines which missing field fails first, rather than this key.
  const rest: unknown = bone.rest;
  if (typeof rest !== "object" || rest === null) return false;
  const rotation: unknown = bone.rest.rotation;
  const translation: unknown = bone.rest.translation;
  const parent: unknown = parentRotation;
  const position: unknown = parentPosition;
  const joint: unknown = articulation;
  if (
    typeof rotation !== "object" ||
    rotation === null ||
    typeof translation !== "object" ||
    translation === null ||
    typeof parent !== "object" ||
    parent === null ||
    typeof position !== "object" ||
    position === null ||
    typeof joint !== "object" ||
    joint === null
  )
    return false;

  return (
    Object.is(values[0], bone.rest.rotation.x) &&
    Object.is(values[1], bone.rest.rotation.y) &&
    Object.is(values[2], bone.rest.rotation.z) &&
    Object.is(values[3], bone.rest.rotation.w) &&
    Object.is(values[4], bone.rest.translation.x) &&
    Object.is(values[5], bone.rest.translation.y) &&
    Object.is(values[6], bone.rest.translation.z) &&
    Object.is(values[7], articulation.x) &&
    Object.is(values[8], articulation.y) &&
    Object.is(values[9], articulation.z) &&
    Object.is(values[10], articulation.w) &&
    Object.is(values[11], parentRotation.x) &&
    Object.is(values[12], parentRotation.y) &&
    Object.is(values[13], parentRotation.z) &&
    Object.is(values[14], parentRotation.w) &&
    Object.is(values[15], parentPosition.x) &&
    Object.is(values[16], parentPosition.y) &&
    Object.is(values[17], parentPosition.z)
  );
}

/** Isolate the reader's private dependency result from every caller-owned transform. */
function copyBone(
  bone: AutoMovieHumanoidBone,
  values: readonly number[],
): IAutoMovieResolvedBone {
  return {
    bone,
    localRotation: {
      x: values[18]!,
      y: values[19]!,
      z: values[20]!,
      w: values[21]!,
    },
    worldPosition: { x: values[22]!, y: values[23]!, z: values[24]! },
    worldRotation: {
      x: values[25]!,
      y: values[26]!,
      z: values[27]!,
      w: values[28]!,
    },
  };
}
