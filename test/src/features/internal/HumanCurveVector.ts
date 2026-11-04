

type V3 = [number, number, number];

/** Vector arithmetic of the curve rules. */
export namespace HumanCurveVector {
  /** Sum of two vectors. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference of two vectors, the first minus the second. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Dot product of two vectors. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product of two vectors. */
  export function cross(a: V3, b: V3): V3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** A vector scaled to unit length; a zero vector stays zero. */
  export function unit(a: V3): V3 {
    const l: number = Math.sqrt(dot(a, a)) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Distance between two points. */
  export function distance(a: V3, b: V3): number {
    const d: V3 = sub(a, b);
    return Math.sqrt(dot(d, d));
  }

  /** A value held to the range of a cosine, -1 to 1. */
  export function clamp(v: number): number {
    return Math.min(1, Math.max(-1, v));
  }
}
