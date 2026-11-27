import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * The small vector and easing mathematics the leg's pieces share: points and
 * directions in the body frame as triples of millimetres, and the smooth steps
 * that start and end without velocity.
 */
export namespace AutoMovieHumanLegVector {
  /** Sum. */
  export function plus(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference `a - b` of any three-component lists. */
  export function sub(
    a: readonly number[],
    b: readonly number[],
  ): AutoMovieVector3Tuple {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Scalar multiple. */
  export function scale(
    a: AutoMovieVector3Tuple,
    s: number,
  ): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** Cross product. */
  export function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Euclidean length. */
  export function norm(a: AutoMovieVector3Tuple): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit vector; a zero vector stays zero. */
  export function normalize(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return AutoMovieEngineVector3.normalizeTuple(a);
  }

  /** Linear interpolation `a + (b - a) t`. */
  export function lerp(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ): AutoMovieVector3Tuple {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  /** A vector turned about a unit axis by an angle (Rodrigues' formula). */
  export function rotate(
    v: AutoMovieVector3Tuple,
    axis: AutoMovieVector3Tuple,
    angle: number,
  ): AutoMovieVector3Tuple {
    if (angle === 0) return v;
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const k: AutoMovieVector3Tuple = cross(axis, v);
    const d: number = dot(axis, v) * (1 - c);
    return [
      v[0] * c + k[0] * s + axis[0] * d,
      v[1] * c + k[1] * s + axis[1] * d,
      v[2] * c + k[2] * s + axis[2] * d,
    ];
  }

  /** Smoothstep clamped to [0, 1]. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /** Smootherstep clamped to [0, 1], flat to the second derivative at both ends. */
  export function fifth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (t * (6 * t - 15) + 10);
  }
}
