import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanTrunkFeatureFrame,
} from "@automovie/interface";

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
  /**
   * A frame from an origin, an axis and a hint of the up direction.
   *
   * @param origin The centre on the wall, mm.
   * @param axis The outward direction, any length.
   * @param up A direction the frame's up is the closest perpendicular of to the axis.
   * @returns The frame.
   */
  export function create(
    origin: AutoMovieVector3Tuple,
    axis: AutoMovieVector3Tuple,
    up: AutoMovieVector3Tuple = [0, 1, 0],
  ): IAutoMovieHumanTrunkFeatureFrame.IFrame {
    const a: AutoMovieVector3Tuple = unit(axis);
    const d: number = dot(up, a);
    const u: AutoMovieVector3Tuple = unit([
      up[0] - d * a[0],
      up[1] - d * a[1],
      up[2] - d * a[2],
    ]);

    return { origin, axis: a, up: u, lateral: cross(a, u) };
  }

  /**
   * The frame of a feature centred on the trunk's midline: the wall's outward
   * normal on the midline of a mirror-symmetric section is the sagittal
   * direction, forward on the front and backward on the back. The sternal
   * notch (the jugular notch over the manubrium, Gray 1918), the umbilicus (at
   * omphalion, ANSUR II) and the spinal furrow (on the spinous line) stand so.
   *
   * @param y Height of the feature's centre, mm.
   * @param place The midline's forward place at that height, mm.
   * @param side Which midline: the front's axis is forward, the back's backward.
   * @returns The frame on the midline.
   */
  export function midline(
    y: number,
    place: number,
    side: "front" | "back",
  ): IAutoMovieHumanTrunkFeatureFrame.IFrame {
    return create([place, y, 0], [side === "front" ? 1 : -1, 0, 0]);
  }

  /**
   * A body point's coordinates in a frame.
   *
   * @param frame The frame.
   * @param p A body point, mm.
   * @returns `[u, v, w]`: along lateral, up and axis, mm.
   */
  export function local(
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame,
    p: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const d: AutoMovieVector3Tuple = [
      p[0] - frame.origin[0],
      p[1] - frame.origin[1],
      p[2] - frame.origin[2],
    ];

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
  export function body(
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame,
    u: number,
    v: number,
    w: number,
  ): AutoMovieVector3Tuple {
    return [0, 1, 2].map(
      (k: number): number =>
        frame.origin[k]! +
        u * frame.lateral[k]! +
        v * frame.up[k]! +
        w * frame.axis[k]!,
    ) as AutoMovieVector3Tuple;
  }

  /**
   * A left frame reflected onto the right side (rule J6): z negated, and the
   * lateral axis negated so the frame stays right-handed.
   *
   * @param frame The left frame.
   * @returns The right frame.
   */
  export function mirror(
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame,
  ): IAutoMovieHumanTrunkFeatureFrame.IFrame {
    const flip = (v: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
      v[0],
      v[1],
      -v[2],
    ];

    return {
      origin: flip(frame.origin),
      axis: flip(frame.axis),
      up: flip(frame.up),
      lateral: cross(flip(frame.axis), flip(frame.up)),
    };
  }

  /*
   * Dot product.
   */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /*
   * Cross product.
   */
  function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /*
   * Unit vector; the zero vector stays zero.
   */
  function unit(a: readonly number[]): AutoMovieVector3Tuple {
    const n: number = Math.hypot(a[0]!, a[1]!, a[2]!) || 1;

    return [a[0]! / n, a[1]! / n, a[2]! / n];
  }
}
