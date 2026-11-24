import type { PartConicTypes as T } from "./PartConicTypes";

/** Coordinate operations for explicit part section inputs. */
export namespace PartConicInput {
  /** Signed polygon area distinguishes the original chart orientation without moving a point. */
  export function area(points: readonly T.P[]): number {
    return (
      points.reduce((sum: number, p: T.P, i: number): number => {
        const q: T.P = points[(i + 1) % points.length]!;
        return sum + p[0] * q[1] - p[1] * q[0];
      }, 0) / 2
    );
  }
  /** Dot product in the fixed registered world frame. */
  export function dot(a: T.V, b: T.V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  /** Vector difference, without changing registration or handedness. */
  export function sub(a: T.V, b: T.V): T.V {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  /** Scalar multiplication of a world vector. */
  export function scale(a: T.V, t: number): T.V {
    return [a[0] * t, a[1] * t, a[2] * t];
  }
  /** Right-handed Cartesian vector product; source planes retain v cross u as their normal. */
  export function cross(a: T.V, b: T.V): T.V {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
}
