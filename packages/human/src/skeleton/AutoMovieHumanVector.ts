import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The few vector operations skeleton generation needs, on plain `IAutoMovieVector3` records, each returning a new record.
 *
 * @author Samchon
 */
export namespace AutoMovieHumanVector {
  /**
   * Build a vector.
   *
   * @param x X component
   * @param y Y component
   * @param z Z component
   * @returns The vector
   */
  export function of(x: number, y: number, z: number): IAutoMovieVector3 {
    return { x, y, z };
  }

  /**
   * Sum of a point and scaled directions.
   *
   * @param origin Starting point
   * @param terms Pairs of direction and scale added to it
   * @returns `origin + Σ scale·direction`
   */
  export function offset(
    origin: IAutoMovieVector3,
    ...terms: Array<[IAutoMovieVector3, number]>
  ): IAutoMovieVector3 {
    let { x, y, z }: IAutoMovieVector3 = origin;
    for (const [direction, scale] of terms) {
      x += direction.x * scale;
      y += direction.y * scale;
      z += direction.z * scale;
    }
    return { x, y, z };
  }

  /**
   * Cross product.
   *
   * @param a Left operand
   * @param b Right operand
   * @returns `a × b`
   */
  export function cross(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  /**
   * Dot product.
   *
   * @param a Left operand
   * @param b Right operand
   * @returns `a · b`
   */
  export function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  /**
   * Unit vector in the same direction.
   *
   * @param v Non-zero vector
   * @returns `v / |v|`
   */
  export function normalize(v: IAutoMovieVector3): IAutoMovieVector3 {
    const length: number = Math.hypot(v.x, v.y, v.z);
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  }

  /**
   * Distance between two points.
   *
   * @param a First point
   * @param b Second point
   * @returns `|a − b|`
   */
  export function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /**
   * Rotate a point about an axis parallel to +Z through a pivot, by the right-hand rule.
   *
   * @param point Point to rotate
   * @param pivot Point on the axis
   * @param degrees Angle, positive counter-clockwise seen from +Z
   * @returns The rotated point
   */
  export function rotateZ(
    point: IAutoMovieVector3,
    pivot: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 {
    const radians: number = (degrees * Math.PI) / 180;
    const c: number = Math.cos(radians);
    const s: number = Math.sin(radians);
    const x: number = point.x - pivot.x;
    const y: number = point.y - pivot.y;
    return {
      x: pivot.x + x * c - y * s,
      y: pivot.y + x * s + y * c,
      z: point.z,
    };
  }
}
