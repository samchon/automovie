/**
 * Small immutable tuple vector algebra shared by staging, IK and contact measurement.
 *
 * @evidence contracts/common.md#implementation-and-ownership Plain tuples keep per-frame choreography allocation-light and free of three.js, so the same code runs in Node tests and in the browser. Every function returns a new tuple and never mutates its inputs.
 * @evidence contracts/common.md#authoring-interface Components are metres in whatever frame the caller states; world frames are +Y up. Angles are radians. `rotateY` uses the three.js convention, where a positive angle turns +X toward -Z.
 */
export namespace Vec3 {
  /**
   * Three components in the caller's stated frame.
   *
   * @evidence contracts/common.md#implementation-and-ownership Readonly tuple, never mutated.
   * @evidence contracts/common.md#authoring-interface Metres in the caller's frame.
   */
  export type Value = readonly [number, number, number];

  /**
   * Component-wise sum.
   *
   * @evidence contracts/common.md#implementation-and-ownership Component-wise.
   * @evidence contracts/common.md#authoring-interface Same frame for both inputs.
   */
  export function add(a: Value, b: Value): Value {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /**
   * Component-wise difference `a - b`.
   *
   * @evidence contracts/common.md#implementation-and-ownership Component-wise.
   * @evidence contracts/common.md#authoring-interface Same frame for both inputs.
   */
  export function sub(a: Value, b: Value): Value {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * Uniform scale.
   *
   * @evidence contracts/common.md#implementation-and-ownership Component-wise.
   * @evidence contracts/common.md#authoring-interface Scalar factor.
   */
  export function scale(a: Value, s: number): Value {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /**
   * Dot product.
   *
   * @evidence contracts/common.md#implementation-and-ownership Sum of products.
   * @evidence contracts/common.md#authoring-interface Same frame for both inputs.
   */
  export function dot(a: Value, b: Value): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Right-handed cross product.
   *
   * @evidence contracts/common.md#implementation-and-ownership Right-handed determinant expansion.
   * @evidence contracts/common.md#authoring-interface Same frame for both inputs.
   */
  export function cross(a: Value, b: Value): Value {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * Euclidean length.
   *
   * @evidence contracts/common.md#implementation-and-ownership Math.hypot.
   * @evidence contracts/common.md#authoring-interface Metres.
   */
  export function length(a: Value): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /**
   * Distance between two points.
   *
   * @evidence contracts/common.md#implementation-and-ownership Length of the difference.
   * @evidence contracts/common.md#authoring-interface Metres.
   */
  export function distance(a: Value, b: Value): number {
    return length(sub(a, b));
  }

  /**
   * Unit vector; a zero vector stays zero instead of producing NaN.
   *
   * @evidence contracts/common.md#implementation-and-ownership Divides by length; returns zero for a zero vector instead of NaN.
   * @evidence contracts/common.md#authoring-interface Unit or zero vector.
   */
  export function normalize(a: Value): Value {
    const size: number = length(a);
    return size > 1e-12 ? scale(a, 1 / size) : [0, 0, 0];
  }

  /**
   * Linear interpolation, unclamped.
   *
   * @evidence contracts/common.md#implementation-and-ownership Unclamped linear interpolation.
   * @evidence contracts/common.md#authoring-interface Same frame for both inputs.
   */
  export function lerp(a: Value, b: Value, t: number): Value {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  /**
   * Rotate about +Y by `angle` radians (three.js sign: +X turns toward -Z).
   *
   * @evidence contracts/common.md#implementation-and-ownership Rotation matrix about +Y with three.js sign.
   * @evidence contracts/common.md#authoring-interface Radians; +X turns toward −Z.
   */
  export function rotateY(a: Value, angle: number): Value {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return [a[0] * c + a[2] * s, a[1], -a[0] * s + a[2] * c];
  }

  /**
   * Rotate by a unit quaternion `[x, y, z, w]`.
   *
   * @evidence contracts/common.md#implementation-and-ownership Expanded quaternion sandwich product.
   * @evidence contracts/common.md#authoring-interface Unit quaternion [x, y, z, w].
   */
  export function rotate(
    a: Value,
    q: readonly [number, number, number, number],
  ): Value {
    const [x, y, z, w] = q;

    // v' = v + 2w(q×v) + 2q×(q×v), the expanded sandwich product.
    const tx: number = 2 * (y * a[2] - z * a[1]);
    const ty: number = 2 * (z * a[0] - x * a[2]);
    const tz: number = 2 * (x * a[1] - y * a[0]);
    return [
      a[0] + w * tx + (y * tz - z * ty),
      a[1] + w * ty + (z * tx - x * tz),
      a[2] + w * tz + (x * ty - y * tx),
    ];
  }

  /**
   * Horizontal heading of a direction: the yaw that turns +X onto it.
   *
   * @evidence contracts/common.md#implementation-and-ownership atan2 of the horizontal components, inverse of rotateY on +X.
   * @evidence contracts/common.md#authoring-interface Radians.
   */
  export function heading(direction: Value): number {
    return Math.atan2(-direction[2], direction[0]);
  }
}
