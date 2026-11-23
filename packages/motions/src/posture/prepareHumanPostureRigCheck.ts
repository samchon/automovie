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
 * Snapshot the live scalar prerequisites of one actual cold free-leg or
 * joint-only source and check them directly before lending its solution. No
 * transform, pose, projection or fitted result is stored here. Unsupported
 * snapshot inputs decline preparation, and changed/malformed live inputs
 * decline reuse.
 */
export function prepareHumanPostureRigCheck(
  body: IAutoMovieMotionHumanBody,
): (() => boolean) | undefined {
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
    const rig: IAutoMovieMotionHumanBody["poseResolution"] =
      body.poseResolution;
    const topology: IAutoMovieMotionHumanBody["topology"] = body.topology;
    // structuredClone preserved the shared bone records between the skeleton
    // and its child lists. A child still pointing at the corresponding live
    // skeleton record has already passed the complete bone comparison.
    const rows: Map<IAutoMovieBone, number> = new Map();
    for (const [index, value] of saved.skeleton.bones.entries())
      rows.set(value, index);
    const child: typeof bone = (
      actual: IAutoMovieBone,
      baseline: IAutoMovieBone,
    ): boolean => {
      const index: number | undefined = rows.get(baseline);
      return (
        (index !== undefined && actual === body.skeleton.bones[index]) ||
        bone(actual, baseline)
      );
    };
    const check: () => boolean = (): boolean => {
      try {
        const same: boolean =
          body.poseResolution === rig &&
          body.topology === topology &&
          body.skeleton.id === saved.skeleton.id &&
          sequence(body.skeleton.bones, saved.skeleton.bones, bone) &&
          sequence<IChildren>(
            body.topology.childrenByParent,
            saved.children,
            (a: IChildren, b: IChildren): boolean =>
              a[0] === b[0] && sequence(a[1], b[1], child),
          ) &&
          sequence(
            body.topology.reachableBones,
            saved.reachable,
            (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone): boolean =>
              a === b,
          ) &&
          entries(DEFAULT_HUMANOID_ROM, saved.defaults, constraint) &&
          entries(HUMANOID_JOINT_AXES, saved.axes, axes) &&
          axes(DEFAULT_JOINT_AXES, saved.fallback) &&
          entries(HUMANOID_REST_FRAME, saved.frames, frame);
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

/**
 * Only current immutable metadata is shared; every reuse performs a fresh live
 * comparison.
 */
const CURRENT: WeakMap<IAutoMovieMotionHumanBody, () => boolean> =
  new WeakMap();

/** One topology entry, including ordered child records rather than names alone. */
type IChildren = readonly [string, readonly IAutoMovieBone[]];

/** Owned source snapshots for exactly the fields the former signature projected. */
interface ISnapshot {
  skeleton: IAutoMovieMotionHumanBody["skeleton"];
  children: readonly IChildren[];
  reachable: readonly AutoMovieHumanoidBone[];
  defaults: readonly (readonly [
    string,
    IAutoMovieJointConstraint | undefined,
  ])[];
  axes: readonly (readonly [string, IAutoMovieJointAxes | undefined])[];
  fallback: IAutoMovieJointAxes;
  frames: readonly (readonly [string, IAutoMovieRestFrame | undefined])[];
}

/**
 * Compare ordered current values without copying the collection or retaining a
 * verdict.
 */
function sequence<T>(
  actual: Iterable<T>,
  saved: readonly T[],
  equal: (a: T, b: T) => boolean,
): boolean {
  let at: number = 0;
  for (const value of actual) {
    if (at >= saved.length || !equal(value, saved[at]!)) return false;
    ++at;
  }
  return at === saved.length;
}

/** Table property order and every typed value remain part of source equivalence. */
function entries<T>(
  actual: Readonly<Record<string, T>>,
  saved: readonly (readonly [string, T])[],
  equal: (a: T, b: T) => boolean,
): boolean {
  const keys: string[] = Object.keys(actual);
  if (keys.length !== saved.length) return false;
  for (let index: number = 0; index < keys.length; ++index) {
    const key: string = keys[index]!;
    const baseline: readonly [string, T] = saved[index]!;
    if (key !== baseline[0] || !equal(actual[key]!, baseline[1])) return false;
  }
  return true;
}

/** Exact numeric components retain signed zero and nonfinite distinctions. */
function vector(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z);
}

/** Quaternion components are compared without normalization or sign folding. */
function quaternion(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  return vector(a, b) && Object.is(a.w, b.w);
}

/**
 * All live bone fields, including ignored scale, invalidate source transport on
 * edits.
 */
function bone(a: IAutoMovieBone, b: IAutoMovieBone): boolean {
  return (
    a.bone === b.bone &&
    a.parent === b.parent &&
    vector(a.rest.translation, b.rest.translation) &&
    quaternion(a.rest.rotation, b.rest.rotation) &&
    vector(a.rest.scale, b.rest.scale) &&
    constraint(a.constraint, b.constraint) &&
    axes(a.axes, b.axes)
  );
}

/** Null, omission and both interval ends remain distinct source metadata. */
function range(
  a: IAutoMovieAngleRange | null | undefined,
  b: IAutoMovieAngleRange | null | undefined,
): boolean {
  return a === null || a === undefined || b === null || b === undefined
    ? a === b
    : Object.is(a.min, b.min) && Object.is(a.max, b.max);
}

/**
 * Every axis box, combined cap and swing-twist domain field is checked
 * directly.
 */
function constraint(
  a: IAutoMovieJointConstraint | null | undefined,
  b: IAutoMovieJointConstraint | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined)
    return a === b;
  if (
    !range(a.flexion, b.flexion) ||
    !range(a.abduction, b.abduction) ||
    !range(a.twist, b.twist) ||
    !Object.is(a.swingDeg, b.swingDeg)
  )
    return false;
  const x: IAutoMovieJointConstraint["swingTwist"] = a.swingTwist;
  const y: IAutoMovieJointConstraint["swingTwist"] = b.swingTwist;
  return x === null || x === undefined || y === null || y === undefined
    ? x === y
    : range(x.twist, y.twist) && Object.is(x.reach, y.reach);
}

/**
 * Actual basis vectors, intrinsic twist placement and explicit rotation order
 * are checked before normalization.
 */
function axes(
  a: IAutoMovieJointAxes | undefined,
  b: IAutoMovieJointAxes | undefined,
): boolean {
  return a === undefined || b === undefined
    ? a === b
    : vector(a.flexion, b.flexion) &&
        vector(a.abduction, b.abduction) &&
        vector(a.twist, b.twist) &&
        a.twistPlacement === b.twistPlacement &&
        a.rotationOrder === b.rotationOrder;
}

/**
 * Clinical affine signs/neutrals and axis omission are checked in original axis
 * order.
 */
function frame(
  a: IAutoMovieRestFrame | undefined,
  b: IAutoMovieRestFrame | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b;
  for (const key of ["flexion", "abduction", "twist"] as const) {
    const x: IAutoMovieRestFrame[typeof key] = a[key];
    const y: IAutoMovieRestFrame[typeof key] = b[key];
    if (x === undefined || y === undefined) {
      if (x !== y) return false;
    } else if (!Object.is(x.sign, y.sign) || !Object.is(x.neutral, y.neutral))
      return false;
  }
  return true;
}
