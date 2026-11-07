import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/** Tuple boundary for this film's authored coordinates; all vector computation delegates the Engine owner. */
export namespace FilmVector {
  /** Authored world or actor-frame metres, as the caller declares. */
  export type Value = readonly [number, number, number];
  /** Convert a film tuple to the public Engine representation. */
  export function vector(value: Value): IAutoMovieVector3 {
    return {
      x: value[0],
      y: value[1],
      z: value[2],
    };
  }
  /** Convert an Engine result back to an owned authored tuple. */
  export function tuple(value: IAutoMovieVector3): [number, number, number] {
    return [value.x, value.y, value.z];
  }
  /** Same-frame addition. */
  export function add(a: Value, b: Value): Value {
    return tuple(Vector3.add(vector(a), vector(b)));
  }
  /** Same-frame subtraction. */
  export function sub(a: Value, b: Value): Value {
    return tuple(Vector3.subtract(vector(a), vector(b)));
  }
  /** Scalar multiplication. */
  export function scale(a: Value, factor: number): Value {
    return tuple(Vector3.scale(vector(a), factor));
  }
  /** Euclidean magnitude. */
  export function length(a: Value): number {
    return Vector3.length(vector(a));
  }
  /** Euclidean distance. */
  export function distance(a: Value, b: Value): number {
    return length(sub(a, b));
  }
  /** Same-frame dot product. */
  export function dot(a: Value, b: Value): number {
    return Vector3.dot(vector(a), vector(b));
  }
  /** Zero remains zero; other directions become unit vectors. */
  export function normalize(a: Value): Value {
    return tuple(Vector3.normalize(vector(a)));
  }
  /** Affine interpolation in the author's declared frame. */
  export function lerp(a: Value, b: Value, progress: number): Value {
    return add(a, scale(sub(b, a), progress));
  }
  /** Apply a unit actor/world quaternion. */
  export function rotate(
    a: Value,
    q: readonly [number, number, number, number],
  ): Value {
    return tuple(
      Quaternion.rotateVector(
        { x: q[0], y: q[1], z: q[2], w: q[3] },
        vector(a),
      ),
    );
  }
  /** Film heading turns +X toward -Z around world +Y, in radians. */
  export function rotateY(a: Value, radians: number): Value {
    return rotate(a, [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)]);
  }
  /** Heading of an authored horizontal direction, radians. */
  export function heading(a: Value): number {
    return Math.atan2(-a[2], a[0]);
  }
  /** Compose borrowed film rotations through the shared Hamilton product. */
  export function multiply(
    a: readonly [number, number, number, number],
    b: readonly [number, number, number, number],
  ): [number, number, number, number] {
    const result: ReturnType<typeof Quaternion.multiply> = Quaternion.multiply(
      { x: a[0], y: a[1], z: a[2], w: a[3] },
      { x: b[0], y: b[1], z: b[2], w: b[3] },
    );
    return [result.x, result.y, result.z, result.w];
  }
}
