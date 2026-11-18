import {
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Snapshot the live scalar prerequisites of one actual cold free-leg or joint-only source
 * and check them directly before lending its solution. No transform, pose,
 * projection or fitted result is stored here. Unsupported snapshot inputs
 * decline preparation, and changed/malformed live inputs decline reuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual-source provenance, live rig/topology/ROM/axes/clinical prerequisites, signed-zero-sensitive checks and ordinary fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Free-leg resolution reads skeleton/rest data, topology and canonical range/basis/frame tables. Complete typed snapshots and ordered Object.is comparisons prove those dependencies unchanged without serialization; actual rig/topology owner replacement also invalidates. Profile/measure data is unused by this restricted solve.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner separates typed snapshot creation from live comparison and detects complete rig epoch changes. Limb fits keep no memory, so a cold fallback after a mismatch solves against the current rig with nothing to release.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Checks every original projected field, topology entry/order, table entry/order and default basis without tolerance, numeric coercion, mutable identity trust or a result cache; any changed or unreadable field falls back.
 * @evidence contracts/development/implementation.md#efficient-algorithms Snapshot and each comparison take O(B+T) for B live/topology records and T table entries. A later producer first compares the current typed snapshot and copies only after a mismatch, removing repeated whole-rig structuredClone calls. Consumption still directly compares every current scalar; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One weak body's current immutable scalar snapshot may serve multiple actual cold producers only after a fresh complete comparison. Every producer/consumer rereads bound body and canonical tables, so in-place edits, replacements and order changes invalidate; no previous comparison verdict, pose or fit answer is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak body owns one current typed metadata snapshot/checker; issued sources retain their original checker only until release. No linked epoch history, FK reader, target, fitted result, callback result or handle is retained here.
 */
export function prepareHumanPostureRigCheck(body: IAutoMovieMotionHumanBody): (() => boolean) | undefined {
  try {
    const current: (() => boolean) | undefined = CURRENT.get(body);
    if (current !== undefined && current()) return current;
    const saved: ISnapshot = structuredClone({
      skeleton: body.skeleton,
      children: [...body.topology.childrenByParent],
      reachable: [...body.topology.reachableBones],
      defaults: Object.entries(DEFAULT_HUMANOID_ROM),
      axes: Object.entries(HUMANOID_JOINT_AXES),
      fallback: DEFAULT_JOINT_AXES,
      frames: Object.entries(HUMANOID_REST_FRAME),
    });
    const rig: IAutoMovieMotionHumanBody["poseResolution"] = body.poseResolution;
    const topology: IAutoMovieMotionHumanBody["topology"] = body.topology;
    // structuredClone preserved the shared bone records between the skeleton
    // and its child lists. A child still pointing at the corresponding live
    // skeleton record has already passed the complete bone comparison.
    const rows: Map<IAutoMovieBone, number> = new Map();
    for (const [index, value] of saved.skeleton.bones.entries()) rows.set(value, index);
    const child: typeof bone = (actual: IAutoMovieBone, baseline: IAutoMovieBone): boolean => {
      const index: number | undefined = rows.get(baseline);
      return (index !== undefined && actual === body.skeleton.bones[index]) || bone(actual, baseline);
    };
    const check: () => boolean = (): boolean => {
      try {
        const same: boolean = body.poseResolution === rig && body.topology === topology &&
          body.skeleton.id === saved.skeleton.id &&
          sequence(body.skeleton.bones, saved.skeleton.bones, bone) &&
          sequence<IChildren>(body.topology.childrenByParent, saved.children,
            (a: IChildren, b: IChildren): boolean => a[0] === b[0] && sequence(a[1], b[1], child)) &&
          sequence(body.topology.reachableBones, saved.reachable,
            (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): boolean => a === b) &&
          entries(Object.entries(DEFAULT_HUMANOID_ROM), saved.defaults, constraint) &&
          entries(Object.entries(HUMANOID_JOINT_AXES), saved.axes, axes) &&
          axes(DEFAULT_JOINT_AXES, saved.fallback) &&
          entries(Object.entries(HUMANOID_REST_FRAME), saved.frames, frame);
        return same;
      } catch {
        return false;
      }
    };
    CURRENT.set(body, check);
    return check;
  } catch {
    return undefined;
  }
}

/** Only current immutable metadata is shared; every reuse performs a fresh live comparison. */
const CURRENT: WeakMap<IAutoMovieMotionHumanBody, () => boolean> = new WeakMap();

/** One topology entry, including ordered child records rather than names alone. */
type IChildren = readonly [string, readonly IAutoMovieBone[]];

/** Owned source snapshots for exactly the fields the former signature projected. */
interface ISnapshot {
  skeleton: IAutoMovieMotionHumanBody["skeleton"];
  children: readonly IChildren[];
  reachable: readonly AutoMovieHumanoidBone[];
  defaults: readonly (readonly [string, IAutoMovieJointConstraint | undefined])[];
  axes: readonly (readonly [string, IAutoMovieJointAxes | undefined])[];
  fallback: IAutoMovieJointAxes;
  frames: readonly (readonly [string, IAutoMovieRestFrame | undefined])[];
}

/** Compare ordered current values without copying the collection or retaining a verdict. */
function sequence<T>(actual: Iterable<T>, saved: readonly T[], equal: (a: T, b: T) => boolean): boolean {
  let at: number = 0;
  for (const value of actual) {
    if (at >= saved.length || !equal(value, saved[at]!)) return false;
    ++at;
  }
  return at === saved.length;
}

/** Table property order and every typed value remain part of source equivalence. */
function entries<T>(actual: readonly (readonly [string, T])[], saved: readonly (readonly [string, T])[], equal: (a: T, b: T) => boolean): boolean {
  return sequence(actual, saved,
    (a: readonly [string, T], b: readonly [string, T]): boolean => a[0] === b[0] && equal(a[1], b[1]));
}

/** Exact numeric components retain signed zero and nonfinite distinctions. */
function vector(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z);
}

/** Quaternion components are compared without normalization or sign folding. */
function quaternion(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  return vector(a, b) && Object.is(a.w, b.w);
}

/** All live bone fields, including ignored scale, invalidate source transport on edits. */
function bone(a: IAutoMovieBone, b: IAutoMovieBone): boolean {
  return a.bone === b.bone && a.parent === b.parent &&
    vector(a.rest.translation, b.rest.translation) && quaternion(a.rest.rotation, b.rest.rotation) &&
    vector(a.rest.scale, b.rest.scale) && constraint(a.constraint, b.constraint) && axes(a.axes, b.axes);
}

/** Null, omission and both interval ends remain distinct source metadata. */
function range(a: IAutoMovieAngleRange | null | undefined, b: IAutoMovieAngleRange | null | undefined): boolean {
  return a === null || a === undefined || b === null || b === undefined
    ? a === b : Object.is(a.min, b.min) && Object.is(a.max, b.max);
}

/** Every axis box, combined cap and swing-twist domain field is checked directly. */
function constraint(a: IAutoMovieJointConstraint | null | undefined, b: IAutoMovieJointConstraint | null | undefined): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  if (!range(a.flexion, b.flexion) || !range(a.abduction, b.abduction) ||
    !range(a.twist, b.twist) || !Object.is(a.swingDeg, b.swingDeg)) return false;
  const x: IAutoMovieJointConstraint["swingTwist"] = a.swingTwist;
  const y: IAutoMovieJointConstraint["swingTwist"] = b.swingTwist;
  return x === null || x === undefined || y === null || y === undefined
    ? x === y : range(x.twist, y.twist) && Object.is(x.reach, y.reach);
}

/** Actual basis vectors and intrinsic twist placement precede any normalization. */
function axes(a: IAutoMovieJointAxes | undefined, b: IAutoMovieJointAxes | undefined): boolean {
  return a === undefined || b === undefined ? a === b :
    vector(a.flexion, b.flexion) && vector(a.abduction, b.abduction) &&
    vector(a.twist, b.twist) && a.twistPlacement === b.twistPlacement;
}

/** Clinical affine signs/neutrals and axis omission are checked in original axis order. */
function frame(a: IAutoMovieRestFrame | undefined, b: IAutoMovieRestFrame | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  for (const key of ["flexion", "abduction", "twist"] as const) {
    const x: IAutoMovieRestFrame[typeof key] = a[key];
    const y: IAutoMovieRestFrame[typeof key] = b[key];
    if (x === undefined || y === undefined) {
      if (x !== y) return false;
    } else if (!Object.is(x.sign, y.sign) || !Object.is(x.neutral, y.neutral)) return false;
  }
  return true;
}
