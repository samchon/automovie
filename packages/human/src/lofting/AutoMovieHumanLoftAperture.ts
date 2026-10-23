import type { IAutoMovieHumanLoftAperture } from "./IAutoMovieHumanLoftAperture";

/**
 * Openings in the lofted skin, bounded by a closed world curve.
 *
 * An aperture is an anatomical opening such as the palpebral fissure, where
 * the skin ends at the lid margin and the eyeball shows through. The margin
 * is a closed space curve, written as a truncated Fourier series in each
 * world coordinate:
 *
 * ```text
 * P(t) = (x(t), y(t), z(t)),  each a0 + sum_k (a_k cos kt + b_k sin kt)
 * ```
 *
 * The skin around the opening is lofted as if closed (its sections are
 * bridged across the opening); the aperture then removes the bridge by world
 * position, independently of which chain or phase rule produced it:
 *
 * 1. every skin vertex near the opening takes its {@link signed} distance to
 *    the margin seen along the aperture's `forward` axis, negative over the
 *    opening;
 * 2. every triangle is clipped at the zero level of that distance: the
 *    margin crosses an edge where its two vertices differ in sign, a new
 *    vertex is placed there by linear interpolation, and the part over the
 *    opening is dropped.
 *
 * The resulting boundary is an open edge of the skin surface on the margin,
 * which is the anatomy: the skin is not closed over the eye. Clipping works
 * on any mesh, whatever the orientation of the sections that built it, and
 * traces the margin to the mesh resolution.
 */
export namespace AutoMovieHumanLoftAperture {
  /** Point `[x, y, z]` in mm. */
  export type Point = [number, number, number];

  /**
   * World point of the margin at phase t.
   *
   * @param aperture Aperture data.
   * @param t Phase in radians.
   */
  export function evaluate(
    aperture: IAutoMovieHumanLoftAperture,
    t: number,
  ): Point {
    const w: number = 2 * aperture.order + 1;
    const out: Point = [0, 0, 0];
    for (let axis: number = 0; axis < 3; axis++) {
      const c: number[] = aperture.coefficients;
      let v: number = c[axis * w]!;
      for (let k: number = 1; k <= aperture.order; k++)
        v +=
          c[axis * w + 2 * k - 1]! * Math.cos(k * t) +
          c[axis * w + 2 * k]! * Math.sin(k * t);
      out[axis] = v;
    }
    return out;
  }

  /** Dense margin polyline, used for the range, crossings and the inside test. */
  export function polyline(aperture: IAutoMovieHumanLoftAperture): Point[] {
    return Array.from(
      { length: SAMPLES },
      (_: unknown, i: number): Point =>
        evaluate(aperture, (2 * Math.PI * i) / SAMPLES),
    );
  }

  /** Lowest and highest world height of the margin, mm. */
  export function range(margin: readonly Point[]): [number, number] {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const p of margin) {
      lo = Math.min(lo, p[1]);
      hi = Math.max(hi, p[1]);
    }
    return [lo, hi];
  }

  /**
   * The margin seen along the aperture's `forward` axis.
   *
   * Points are projected onto the plane perpendicular to `forward`, spanned
   * by `lateral` and `up`, and keep their depth along `forward`. `lateral`
   * is `forward x` world up (world +X for an opening facing within 25
   * degrees of vertical, such as a nostril, where that product vanishes), and
   * `up = lateral x forward`, which is world up for a horizontal `forward`.
   */
  export interface IOutline {
    /** Unit direction the opening faces. */
    forward: Point;

    /** Unit lateral axis of the projection plane. */
    lateral: Point;

    /** Unit second axis of the projection plane, `lateral x forward`. */
    up: Point;

    /** Projected margin polyline `[lateral, up]`, mm. */
    points: [number, number][];

    /** Depth window along `forward`: the margin's own, widened by `depth`. */
    window: [number, number];

    /** Bounding box of `points`: `[lateral, up]` minimum then maximum. */
    box: [number, number, number, number];
  }

  /** Project a dense margin along the aperture's `forward` axis. */
  export function outline(
    aperture: IAutoMovieHumanLoftAperture,
    margin: readonly Point[],
  ): IOutline {
    const f: Point = aperture.forward;
    const cross = (a: Readonly<Point>, b: Readonly<Point>): Point => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    let lateral: Point = cross(f, [0, 1, 0]);
    if (Math.hypot(...lateral) < 0.42) lateral = cross(f, [1, 0, 0]);
    const length: number = Math.hypot(...lateral);
    lateral = [lateral[0] / length, lateral[1] / length, lateral[2] / length];
    const up: Point = cross(lateral, f);

    let near: number = Infinity;
    let far: number = -Infinity;
    const box: [number, number, number, number] = [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ];
    const points: [number, number][] = margin.map(
      (q: Readonly<Point>): [number, number] => {
        const [u, v] = project(lateral, up, q);
        const depth: number = q[0] * f[0] + q[1] * f[1] + q[2] * f[2];
        near = Math.min(near, depth);
        far = Math.max(far, depth);
        box[0] = Math.min(box[0], u);
        box[1] = Math.min(box[1], v);
        box[2] = Math.max(box[2], u);
        box[3] = Math.max(box[3], v);
        return [u, v];
      },
    );
    return {
      forward: f,
      lateral,
      up,
      points,
      window: [near - aperture.depth, far + aperture.depth],
      box,
    };
  }

  /**
   * Signed distance from a skin point to the margin, seen along `forward`.
   *
   * The point is projected like the margin; the value is its distance to the
   * projected polyline, negative when the projection lies inside it
   * (even-odd rule). A point outside the depth window, or farther than
   * `reach` mm from the outline's bounding box, is skin elsewhere on the
   * body and gets `+Infinity`. The value is continuous across the margin, so
   * its zero level between two vertices of opposite sign locates the margin
   * on the edge joining them.
   *
   * @param outline Projected margin.
   * @param p Skin point in mm.
   * @param reach Distance beyond the bounding box still measured, mm.
   */
  export function signed(
    outline: IOutline,
    p: Readonly<Point>,
    reach: number,
  ): number {
    const f: Point = outline.forward;
    const depth: number = p[0] * f[0] + p[1] * f[1] + p[2] * f[2];
    if (depth < outline.window[0] || depth > outline.window[1]) return Infinity;
    const [u, v] = project(outline.lateral, outline.up, p);
    const b: [number, number, number, number] = outline.box;
    if (
      u < b[0] - reach ||
      v < b[1] - reach ||
      u > b[2] + reach ||
      v > b[3] + reach
    )
      return Infinity;

    // Nearest segment, and the even-odd ray test in the same pass.
    let nearest: number = Infinity;
    let odd: boolean = false;
    const points: [number, number][] = outline.points;
    for (
      let i: number = 0, j: number = points.length - 1;
      i < points.length;
      j = i++
    ) {
      const a: [number, number] = points[j]!;
      const c: [number, number] = points[i]!;
      const du: number = c[0] - a[0];
      const dv: number = c[1] - a[1];
      const l: number = du * du + dv * dv;
      const w: number =
        l > 0
          ? Math.min(1, Math.max(0, ((u - a[0]) * du + (v - a[1]) * dv) / l))
          : 0;
      nearest = Math.min(
        nearest,
        (a[0] + w * du - u) ** 2 + (a[1] + w * dv - v) ** 2,
      );
      if (
        a[1] > v !== c[1] > v &&
        u < ((c[0] - a[0]) * (v - a[1])) / (c[1] - a[1]) + a[0]
      )
        odd = !odd;
    }
    return odd ? -Math.sqrt(nearest) : Math.sqrt(nearest);
  }

  /**
   * Move a point within the projection plane onto the projected margin.
   *
   * The point keeps its depth along `forward`; its in-plane position moves
   * to the nearest point of the projected polyline. Used to place the
   * vertices where the cut crosses the margin exactly on it, instead of
   * where a linear interpolation of the signed distance put them.
   *
   * @param outline Projected margin.
   * @param p Point in mm.
   */
  export function snap(outline: IOutline, p: Readonly<Point>): Point {
    const [u, v] = project(outline.lateral, outline.up, p);
    let best: number = Infinity;
    let target: [number, number] = [u, v];
    const points: [number, number][] = outline.points;
    for (
      let i: number = 0, j: number = points.length - 1;
      i < points.length;
      j = i++
    ) {
      const a: [number, number] = points[j]!;
      const c: [number, number] = points[i]!;
      const du: number = c[0] - a[0];
      const dv: number = c[1] - a[1];
      const l: number = du * du + dv * dv;
      const w: number =
        l > 0
          ? Math.min(1, Math.max(0, ((u - a[0]) * du + (v - a[1]) * dv) / l))
          : 0;
      const d: number = (a[0] + w * du - u) ** 2 + (a[1] + w * dv - v) ** 2;
      if (d < best) {
        best = d;
        target = [a[0] + w * du, a[1] + w * dv];
      }
    }
    const du: number = target[0] - u;
    const dv: number = target[1] - v;
    return [0, 1, 2].map(
      (k: number): number =>
        p[k]! + du * outline.lateral[k]! + dv * outline.up[k]!,
    ) as Point;
  }

  /** In-plane coordinates `[lateral, up]` of a point. */
  function project(
    lateral: Readonly<Point>,
    up: Readonly<Point>,
    p: Readonly<Point>,
  ): [number, number] {
    return [
      p[0] * lateral[0] + p[1] * lateral[1] + p[2] * lateral[2],
      p[0] * up[0] + p[1] * up[1] + p[2] * up[2],
    ];
  }

  /** Margin samples used by the polyline. */
  const SAMPLES: number = 720;
}
