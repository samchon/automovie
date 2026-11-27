import type {
  AutoMovieHumanoidBone,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Own-data copies and exact numerical comparisons used by prepared FK. These
 * copies do not certify valid axes or clinical maps.
 */
export namespace PoseResolutionSnapshot {
  /*
   * The defined entries of a per-bone table, in its own key order.
   */
  export function entries<T>(
    table: Partial<Record<AutoMovieHumanoidBone, T>> | undefined,
  ): [string, T][] {
    const result: [string, T][] = [];
    for (const [name, value] of Object.entries<T | undefined>(table ?? {}))
      if (value !== undefined) result.push([name, value]);
    return result;
  }

  /*
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

  /*
   * Compare actual vector components, retaining signed-zero distinctions.
   */
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

  /*
   * Copy a clinical basis and its exact optional twist placement.
   */
  export function axes(input: IAutoMovieJointAxes): IAutoMovieJointAxes {
    return {
      flexion: vector(input.flexion),
      abduction: vector(input.abduction),
      twist: vector(input.twist),
      ...(input.twistPlacement === undefined
        ? {}
        : { twistPlacement: input.twistPlacement }),
      ...(input.rotationOrder === undefined
        ? {}
        : { rotationOrder: input.rotationOrder }),
    };
  }

  /*
   * Copy three numerical properties in their existing frame and units.
   */
  export function vector(input: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: input.x, y: input.y, z: input.z };
  }

  /*
   * Copy exact quaternion components without normalization.
   */
  export function quaternion(
    input: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    return { x: input.x, y: input.y, z: input.z, w: input.w };
  }

  /*
   * Copy optional affine clinical maps.
   */
  export function frame(input: IAutoMovieRestFrame): IAutoMovieRestFrame {
    const snapshot: IAutoMovieRestFrame = {};
    if (input.flexion !== undefined)
      snapshot.flexion = axisFrame(input.flexion);
    if (input.abduction !== undefined)
      snapshot.abduction = axisFrame(input.abduction);
    if (input.twist !== undefined) snapshot.twist = axisFrame(input.twist);
    return snapshot;
  }
}

/*
 * Copy one affine clinical map.
 */
function axisFrame(input: IAutoMovieAxisFrame): IAutoMovieAxisFrame {
  return { sign: input.sign, neutral: input.neutral };
}
