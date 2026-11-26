import { AutoMovieEnginePlanarHull, Vector3 } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHandVector,
} from "@automovie/interface";

/**
 * The small vector and curve mathematics the hand's pieces share: three-vectors
 * as plain arrays, smooth steps, a rounded maximum and the taut-tape perimeter
 * of a planar point set. Every piece of the hand imports it, so no piece keeps
 * a private copy.
 */
export namespace AutoMovieHumanHandVector {
  /** A whole turn, radians. */
  export const TWO_PI: number = 2 * Math.PI;

  /** Difference. */
  export function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function plus(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scalar multiple. */
  export function scale(
    a: AutoMovieVector3Tuple,
    s: number,
  ): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Euclidean length. */
  export function norm(a: AutoMovieVector3Tuple): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit vector; zero stays zero. */
  export function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return Vector3.normalizeTuple(a);
  }

  /** The part of a vector across a unit heading, as a unit vector. */
  export function across(
    v: AutoMovieVector3Tuple,
    t: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const k: number = dot(v, t);
    return unit([v[0] - k * t[0], v[1] - k * t[1], v[2] - k * t[2]]);
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

  /** Mean of one coordinate of a ring of points. */
  export function mean(ring: AutoMovieVector3Tuple[], c: number): number {
    return (
      ring.reduce(
        (s: number, p: AutoMovieVector3Tuple): number => s + p[c]!,
        0,
      ) / ring.length
    );
  }

  /** Smoothstep clamped to [0, 1]: no slope at either end. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /** Quintic smoothstep clamped to [0, 1]: no slope and no curvature at either end. */
  export function smoother(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * Maximum of two radii with one tangent: exact where they differ by more
   * than `k`, and rounded within `k` of each other by a quarter of the
   * overlap's square over `k` (Quilez's polynomial smooth maximum).
   */
  export function softMax(a: number, b: number, k: number): number {
    const h: number = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.max(a, b) + (h * h * k) / 4;
  }

  /**
   * Perimeter of the convex hull of points in a plane (Andrew's monotone
   * chain): a taut tape drawn round the section, the way a tape measure reads
   * a girth.
   */
  export function hull(points: IAutoMovieHumanHandVector.HullPoints): number {
    return points.length < 3
      ? 0
      : AutoMovieEnginePlanarHull.perimeter(points, 0, 1);
  }
}
