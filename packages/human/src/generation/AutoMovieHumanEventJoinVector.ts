/**
 * The vector arithmetic of the event join: points and directions as triples of
 * millimetres, and the clamped smoothstep its fades use.
 */
export namespace AutoMovieHumanEventJoinVector {
  /** Point or vector in mm. */
  export type Vec3 = [number, number, number];

  /** Smoothstep on [0, 1], clamped. */
  export function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  }

  /** Difference. */
  export function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function add(a: Vec3, b: Vec3): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scalar multiple. */
  export function scale(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Euclidean length. */
  export function norm(a: Vec3): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /** Unit vector. */
  export function unit(a: Vec3): Vec3 {
    return scale(a, 1 / (norm(a) || 1));
  }
}