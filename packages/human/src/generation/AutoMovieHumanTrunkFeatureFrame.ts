/**
 * The frame of a trunk feature that has its own centre: the breast, the
 * gluteal mass, the umbilicus and the spinal furrow are each built in a frame
 * of their own and merged with the trunk at a declared seam, not drawn in the
 * trunk's ring about the trunk's axis.
 *
 * A frame has an origin (the feature's centre on the wall), an outward axis
 * (the direction its height is measured along) and two in-plane axes, `up`
 * and `lateral`, so a point `p` of the body has local coordinates `(u, v, w)`
 * with `u` along `lateral`, `v` along `up` and `w` along `axis`. All vectors
 * are body-frame millimetres, forward +X, up +Y, left +Z; the right side's
 * frames are the left's reflections (rule J6).
 */
export namespace AutoMovieHumanTrunkFeatureFrame {
  /** Three coordinates. */
  export type V3 = [number, number, number];

  /** A feature's frame. */
  export interface IFrame {
    /** The feature's centre on the wall, mm. */
    origin: V3;

    /** Unit axis the height is measured along, outward. */
    axis: V3;

    /** Unit in-plane axis, the feature's up, perpendicular to the axis. */
    up: V3;

    /** Unit in-plane axis toward the body's left, `axis x up`. */
    lateral: V3;
  }

  /**
   * A frame from an origin, an axis and a hint of the up direction.
   *
   * @param origin The centre on the wall, mm.
   * @param axis The outward direction, any length.
   * @param up A direction the frame's up is the closest perpendicular of to the axis.
   * @returns The frame.
   */
  export function create(origin: V3, axis: V3, up: V3 = [0, 1, 0]): IFrame {
    const a: V3 = unit(axis);
    const d: number = dot(up, a);
    const u: V3 = unit([up[0] - d * a[0], up[1] - d * a[1], up[2] - d * a[2]]);

    return { origin, axis: a, up: u, lateral: cross(a, u) };
  }

  /**
   * A body point's coordinates in a frame.
   *
   * @param frame The frame.
   * @param p A body point, mm.
   * @returns `[u, v, w]`: along lateral, up and axis, mm.
   */
  export function local(frame: IFrame, p: V3): V3 {
    const d: V3 = [p[0] - frame.origin[0], p[1] - frame.origin[1], p[2] - frame.origin[2]];

    return [dot(d, frame.lateral), dot(d, frame.up), dot(d, frame.axis)];
  }

  /**
   * A frame's point as a body point.
   *
   * @param frame The frame.
   * @param u Along lateral, mm.
   * @param v Along up, mm.
   * @param w Along the axis, mm.
   * @returns The body point, mm.
   */
  export function body(frame: IFrame, u: number, v: number, w: number): V3 {
    return [0, 1, 2].map(
      (k: number): number => frame.origin[k]! + u * frame.lateral[k]! + v * frame.up[k]! + w * frame.axis[k]!,
    ) as V3;
  }

  /**
   * A left frame reflected onto the right side (rule J6): z negated, and the
   * lateral axis negated so the frame stays right-handed.
   *
   * @param frame The left frame.
   * @returns The right frame.
   */
  export function mirror(frame: IFrame): IFrame {
    const flip = (v: V3): V3 => [v[0], v[1], -v[2]];

    return { origin: flip(frame.origin), axis: flip(frame.axis), up: flip(frame.up), lateral: cross(flip(frame.axis), flip(frame.up)) };
  }

  /** Dot product. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** Cross product. */
  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Unit vector; the zero vector stays zero. */
  function unit(a: readonly number[]): V3 {
    const n: number = Math.hypot(a[0]!, a[1]!, a[2]!) || 1;

    return [a[0]! / n, a[1]! / n, a[2]! / n];
  }
}
