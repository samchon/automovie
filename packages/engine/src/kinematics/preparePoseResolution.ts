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
  values: (number | null | undefined)[];

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
  values: number[];
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
 * @evidence contracts/development/implementation.md#efficient-algorithms Each visited joint or bone compares a fixed-size tuple. Unchanged joints avoid three axis-angle compositions and two products; unchanged bones avoid two products, a vector rotation and an addition. Full scans and fresh outputs remain, while each name's private snapshot row is allocated once and updated after successful computation. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only completed same-valued dependencies are shared across distinct full poses, including newly cloned mirror or layer records. Scalar snapshots detect joint/frame/root/rest edits; changed duplicate joint values miss normally, and private result scalars isolate later reads from output mutation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One last successful joint tuple per distinct authored name and one last world tuple per resolved bone belong to this synchronous reader: O(U+B) for those two populations. No joint or pose record, result history, global collection, handle or task is held; cloned records add no entries.
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
      const reading: IJointReading = rememberJoint(
        known,
        joint,
        basis,
        frame,
        rotation,
      );
      if (known === undefined) joints.set(joint.bone, reading);
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
      const reading: IBoneReading = rememberBone(
        known,
        bone,
        parentRotation,
        parentPosition,
        articulation,
        resolved,
      );
      if (known === undefined) bones.set(bone.bone, reading);
      return resolved;
    },
  };
}

/** Snapshot all caller-owned dependencies before committing to a successful private row. */
function rememberJoint(
  known: IJointReading | undefined,
  joint: IAutoMovieJointPose,
  basis: IAutoMovieJointAxes,
  frame: IAutoMovieRestFrame | undefined,
  rotation: IAutoMovieQuaternion,
): IJointReading {
  const flexionFrame: boolean = frame?.flexion !== undefined;
  const abductionFrame: boolean = frame?.abduction !== undefined;
  const twistFrame: boolean = frame?.twist !== undefined;
  const flexion: number | null = joint.flexion;
  const abduction: number | null = joint.abduction;
  const twist: number | null = joint.twist;
  const flexionSign: number | undefined = frame?.flexion?.sign;
  const flexionNeutral: number | undefined = frame?.flexion?.neutral;
  const abductionSign: number | undefined = frame?.abduction?.sign;
  const abductionNeutral: number | undefined = frame?.abduction?.neutral;
  const twistSign: number | undefined = frame?.twist?.sign;
  const twistNeutral: number | undefined = frame?.twist?.neutral;

  // No caller-owned read follows this commit, so a failed snapshot cannot
  // leave a partially changed key beside the previous successful result.
  const reading: IJointReading = known ?? {
    values: [],
    flexionFrame,
    abductionFrame,
    twistFrame,
    basis,
    rotation: { ...rotation },
  };
  reading.basis = basis;
  reading.flexionFrame = flexionFrame;
  reading.abductionFrame = abductionFrame;
  reading.twistFrame = twistFrame;
  reading.values[0] = flexion;
  reading.values[1] = abduction;
  reading.values[2] = twist;
  reading.values[3] = flexionSign;
  reading.values[4] = flexionNeutral;
  reading.values[5] = abductionSign;
  reading.values[6] = abductionNeutral;
  reading.values[7] = twistSign;
  reading.values[8] = twistNeutral;
  reading.rotation.x = rotation.x;
  reading.rotation.y = rotation.y;
  reading.rotation.z = rotation.z;
  reading.rotation.w = rotation.w;
  return reading;
}

/** Keep one scalar row per bone; a failing input read leaves the previous successful row intact. */
function rememberBone(
  known: IBoneReading | undefined,
  bone: IAutoMovieBone,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  articulation: IAutoMovieQuaternion,
  resolved: IAutoMovieResolvedBone,
): IBoneReading {
  const restX: number = bone.rest.rotation.x;
  const restY: number = bone.rest.rotation.y;
  const restZ: number = bone.rest.rotation.z;
  const restW: number = bone.rest.rotation.w;
  const offsetX: number = bone.rest.translation.x;
  const offsetY: number = bone.rest.translation.y;
  const offsetZ: number = bone.rest.translation.z;
  const jointX: number = articulation.x;
  const jointY: number = articulation.y;
  const jointZ: number = articulation.z;
  const jointW: number = articulation.w;
  const parentX: number = parentRotation.x;
  const parentY: number = parentRotation.y;
  const parentZ: number = parentRotation.z;
  const parentW: number = parentRotation.w;
  const positionX: number = parentPosition.x;
  const positionY: number = parentPosition.y;
  const positionZ: number = parentPosition.z;

  // The completed resolvePoseBone output is fresh plain data. Read mutable
  // input dependencies completely before overwriting this private scalar row.
  const reading: IBoneReading = known ?? { values: [] };
  const values: number[] = reading.values;
  values[0] = restX;
  values[1] = restY;
  values[2] = restZ;
  values[3] = restW;
  values[4] = offsetX;
  values[5] = offsetY;
  values[6] = offsetZ;
  values[7] = jointX;
  values[8] = jointY;
  values[9] = jointZ;
  values[10] = jointW;
  values[11] = parentX;
  values[12] = parentY;
  values[13] = parentZ;
  values[14] = parentW;
  values[15] = positionX;
  values[16] = positionY;
  values[17] = positionZ;
  values[18] = resolved.localRotation.x;
  values[19] = resolved.localRotation.y;
  values[20] = resolved.localRotation.z;
  values[21] = resolved.localRotation.w;
  values[22] = resolved.worldPosition.x;
  values[23] = resolved.worldPosition.y;
  values[24] = resolved.worldPosition.z;
  values[25] = resolved.worldRotation.x;
  values[26] = resolved.worldRotation.y;
  values[27] = resolved.worldRotation.z;
  values[28] = resolved.worldRotation.w;
  return reading;
}

/** Match actual FK inputs, including signed zero, without trusting mutable object identity. */
function sameBone(
  values: readonly number[],
  bone: IAutoMovieBone,
  parentRotation: IAutoMovieQuaternion,
  parentPosition: IAutoMovieVector3,
  articulation: IAutoMovieQuaternion,
): boolean {
  // A non-record transform must reach the original FK owner, whose operation
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
