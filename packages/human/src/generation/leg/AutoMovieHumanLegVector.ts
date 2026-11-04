/**
 * The small vector and easing mathematics the leg's pieces share: points and
 * directions in the body frame as triples of millimetres, and the smooth steps
 * that start and end without velocity.
 */
export namespace AutoMovieHumanLegVector {
  /** A point or direction. */
  export type Vec3 = [number, number, number];

  /** Sum. */
  export function plus(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference `a - b` of any three-component lists. */
  export function sub(a: readonly number[], b: readonly number[]): Vec3 {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Scalar multiple. */
  export function scale(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** Cross product. */
  export function cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Euclidean length. */
  export function norm(a: Vec3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit vector; a zero vector is returned scaled by one. */
  export function normalize(a: Vec3): Vec3 {
    return scale(a, 1 / (norm(a) || 1));
  }

  /** Linear interpolation `a + (b - a) t`. */
  export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /** A vector turned about a unit axis by an angle (Rodrigues' formula). */
  export function rotate(v: Vec3, axis: Vec3, angle: number): Vec3 {
    if (angle === 0) return v;
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const k: Vec3 = cross(axis, v);
    const d: number = dot(axis, v) * (1 - c);
    return [v[0] * c + k[0] * s + axis[0] * d, v[1] * c + k[1] * s + axis[1] * d, v[2] * c + k[2] * s + axis[2] * d];
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
