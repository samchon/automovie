import type {
  AutoMovieHumanoidBone,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Own-data copies and exact numerical comparisons used by prepared FK.
 * Primitive/null malformed values remain unchanged for their original lazy
 * admission owner; these copies do not certify valid axes or clinical maps.
 */
export namespace PoseResolutionSnapshot {
  /**
   * The actual frozen records this owner allocated, including their owned
   * vectors.
   */
  const OWNED_AXES: WeakSet<IAutoMovieJointAxes> = new WeakSet();

  /**
   * Authenticate a frozen axes record and its three frozen direction vectors.
   *
   * @param input The current axes record of a prepared rig.
   * @returns Whether the record came from this snapshot owner with copies of
   *   every object-valued direction.
   */
  export function ownsAxes(input: IAutoMovieJointAxes): boolean {
    return OWNED_AXES.has(input);
  }
  /**
   * Read effective string-keyed mappings, including non-enumerable own fields
   * and custom-prototype fields. The built-in Object prototype declares no
   * humanoid bone key. First occurrence marks a shadow even when undefined,
   * matching direct lookup rather than reviving a hidden ancestor entry.
   */
  export function entries<T>(
    table: Partial<Record<AutoMovieHumanoidBone, T>> | undefined,
  ): [string, T][] {
    const result: [string, T][] = [];
    const seen: Set<string> = new Set();
    const values: Readonly<Record<string, T | undefined>> = table ?? {};
    let current: object | null = table ?? null;
    while (current !== null && current !== Object.prototype) {
      for (const name of Object.getOwnPropertyNames(current)) {
        if (seen.has(name)) continue;
        seen.add(name);
        const value: T | undefined = values[name];
        if (value !== undefined) result.push([name, value]);
      }
      current = Object.getPrototypeOf(current);
    }
    return result;
  }

  /**
   * Compare actual quaternion components, including signed zero, without
   * arithmetic.
   */
  export function sameQuaternion(
    left: IAutoMovieQuaternion,
    right: IAutoMovieQuaternion,
  ): boolean {
    if (left === right) return true;
    return (
      Object.is(left.x, right.x) &&
      Object.is(left.y, right.y) &&
      Object.is(left.z, right.z) &&
      Object.is(left.w, right.w)
    );
  }

  /** Compare actual vector components, retaining signed-zero distinctions. */
  export function sameVector(
    left: IAutoMovieVector3,
    right: IAutoMovieVector3,
  ): boolean {
    if (left === right) return true;
    return (
      Object.is(left.x, right.x) &&
      Object.is(left.y, right.y) &&
      Object.is(left.z, right.z)
    );
  }

  /** Copy an unadmitted clinical basis and its exact optional twist placement. */
  export function axes(input: IAutoMovieJointAxes): IAutoMovieJointAxes {
    if (!hasProperties(input)) return input;
    const snapshot: IAutoMovieJointAxes = Object.freeze({
      flexion: vector(input.flexion),
      abduction: vector(input.abduction),
      twist: vector(input.twist),
      ...(input.twistPlacement === undefined
        ? {}
        : { twistPlacement: input.twistPlacement }),
      ...(input.rotationOrder === undefined
        ? {}
        : { rotationOrder: input.rotationOrder }),
    });
    OWNED_AXES.add(snapshot);
    return snapshot;
  }

  /** Freeze three actual numerical properties in their existing frame and units. */
  export function vector(input: IAutoMovieVector3): IAutoMovieVector3 {
    return !hasProperties(input)
      ? input
      : Object.freeze({ x: input.x, y: input.y, z: input.z });
  }

  /** Freeze exact quaternion components without normalization or enumeration. */
  export function quaternion(
    input: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    return !hasProperties(input)
      ? input
      : Object.freeze({ x: input.x, y: input.y, z: input.z, w: input.w });
  }

  /**
   * Copy optional affine clinical maps while preserving lazy null-angle
   * admission.
   */
  export function frame(input: IAutoMovieRestFrame): IAutoMovieRestFrame {
    if (!hasProperties(input)) return input;
    const snapshot: IAutoMovieRestFrame = {};
    if (input.flexion !== undefined)
      snapshot.flexion = axisFrame(input.flexion);
    if (input.abduction !== undefined)
      snapshot.abduction = axisFrame(input.abduction);
    if (input.twist !== undefined) snapshot.twist = axisFrame(input.twist);
    return Object.freeze(snapshot);
  }
}

/**
 * Preserve malformed scalar/non-record entries for their ordinary toRigAngle
 * refusal.
 */
function axisFrame(input: IAutoMovieAxisFrame): IAutoMovieAxisFrame {
  return !hasProperties(input)
    ? input
    : Object.freeze({ sign: input.sign, neutral: input.neutral });
}

/**
 * Structural numerical records can be ordinary objects or callables with
 * properties.
 */
function hasProperties(input: unknown): boolean {
  return (
    (typeof input === "object" && input !== null) || typeof input === "function"
  );
}
