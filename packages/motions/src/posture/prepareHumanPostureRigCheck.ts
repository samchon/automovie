import {
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieRestFrame,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Snapshot the live scalar prerequisites of one actual cold free-leg or joint-only source
 * and check them directly before lending its solution. No transform, pose,
 * projection or fitted result is stored here. Unsupported snapshot inputs
 * decline preparation, and changed/malformed live inputs decline reuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual-source provenance, live rig/topology/ROM/axes/clinical prerequisites, signed-zero-sensitive checks and ordinary fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Free-leg resolution reads skeleton/rest data, supplied topology and canonical range/basis/frame tables. Owned typed snapshots plus ordered Object.is scalar comparisons prove those same dependencies unchanged without serializing them; profile/measure data is unused by this restricted solve.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner separates one-time typed snapshot creation from repeated live comparison; existing math/admission owners still perform the actual cold solve and token consumption only asks whether its prerequisites remain equal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Checks every original projected field, topology entry/order, table entry/order and default basis without tolerance, numeric coercion, mutable identity trust or a result cache; any changed or unreadable field falls back.
 * @evidence contracts/development/implementation.md#efficient-algorithms Snapshot and each comparison take O(B+T) for live/topology bone records B and canonical table entries T. Consumption creates only ordered table-entry arrays, replacing nested projection strings and full JSON text; no speedup is claimed without measurement.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The source owns copied scalar data, not raw mutable records. Every call rereads actual bound body and canonical tables, so in-place field edits, replacements and order changes invalidate even when identities remain equal; no previous comparison verdict is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The explicit preparation owns one body reference, one bounded typed snapshot and one checker until its weak source/candidates are released; each call's entry arrays end on return/throw and no FK reader, target, callback result, query history or handle is retained.
 */
export function prepareHumanPostureRigCheck(body: IHumanBody): (() => boolean) | undefined {
  try {
    const saved: ISnapshot = structuredClone({
      skeleton: body.skeleton,
      children: [...body.topology.childrenByParent],
      reachable: [...body.topology.reachableBones],
      defaults: Object.entries(DEFAULT_HUMANOID_ROM),
      axes: Object.entries(HUMANOID_JOINT_AXES),
      fallback: DEFAULT_JOINT_AXES,
      frames: Object.entries(HUMANOID_REST_FRAME),
    });
    return (): boolean => {
      try {
        return body.skeleton.id === saved.skeleton.id &&
          sequence(body.skeleton.bones, saved.skeleton.bones, bone) &&
          sequence<IChildren>(body.topology.childrenByParent, saved.children,
            (a: IChildren, b: IChildren): boolean => a[0] === b[0] && sequence(a[1], b[1], bone)) &&
          sequence(body.topology.reachableBones, saved.reachable,
            (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): boolean => a === b) &&
          entries(Object.entries(DEFAULT_HUMANOID_ROM), saved.defaults, constraint) &&
          entries(Object.entries(HUMANOID_JOINT_AXES), saved.axes, axes) &&
          axes(DEFAULT_JOINT_AXES, saved.fallback) &&
          entries(Object.entries(HUMANOID_REST_FRAME), saved.frames, frame);
      } catch {
        return false;
      }
    };
  } catch {
    return undefined;
  }
}

/** One topology entry, including ordered child records rather than names alone. */
type IChildren = readonly [string, readonly IAutoMovieBone[]];

/** Owned source snapshots for exactly the fields the former signature projected. */
interface ISnapshot {
  skeleton: IHumanBody["skeleton"];
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
