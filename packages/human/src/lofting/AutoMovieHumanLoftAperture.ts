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
 * 1. at every station whose height crosses the margin, the crossing points
 *    are inserted into the ring as vertices, so the hole boundary follows
 *    the margin instead of the ring sampling;
 * 2. every skin vertex is classified: inside when, seen along the aperture's
 *    `forward` axis, it falls inside the margin's outline and lies within the
 *    margin's depth window; on the margin when it is an inserted crossing;
 *    outside otherwise;
 * 3. triangles without an outside vertex are dropped.
 *
 * The resulting boundary is an open edge of the skin surface on the margin,
 * which is the anatomy: the skin is not closed over the eye.
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
  export function evaluate(aperture: IAutoMovieHumanLoftAperture, t: number): Point {
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
   * Points where the margin crosses the horizontal plane at height y.
   *
   * Linear interpolation between the dense samples on either side of each
   * sign change; a closed margin crosses an interior height an even number
   * of times, two for a lid margin.
   */
  export function crossings(margin: readonly Point[], y: number): Point[] {
    const out: Point[] = [];
    for (let i: number = 0; i < margin.length; i++) {
      const a: Point = margin[i]!;
      const b: Point = margin[(i + 1) % margin.length]!;
      const da: number = a[1] - y;
      const db: number = b[1] - y;
      if (da === 0) out.push([a[0], a[1], a[2]]);
      else if (da * db < 0) {
        const f: number = da / (da - db);
        out.push([a[0] + f * (b[0] - a[0]), y, a[2] + f * (b[2] - a[2])]);
      }
    }
    return out;
  }

  /**
   * Whether a skin point lies over the opening.
   *
   * The point and the margin are projected along `forward` onto the plane
   * spanned by world up and `forward x up`; the point is inside when its
   * projection is inside the projected margin (even-odd rule) and its depth
   * along `forward` is within the margin's depth range widened by `depth`
   * mm, which keeps skin elsewhere on the head out of the test.
   */
  export function inside(
    aperture: IAutoMovieHumanLoftAperture,
    margin: readonly Point[],
    p: Readonly<Point>,
  ): boolean {
    const f: Point = aperture.forward;
    const up: Point = [0, 1, 0];

    // Lateral axis: forward x up, so the projection plane is (lateral, up).
    const l: Point = [
      f[1] * up[2] - f[2] * up[1],
      f[2] * up[0] - f[0] * up[2],
      f[0] * up[1] - f[1] * up[0],
    ];
    const project = (q: Readonly<Point>): [number, number, number] => [
      q[0] * l[0] + q[1] * l[1] + q[2] * l[2],
      q[1],
      q[0] * f[0] + q[1] * f[1] + q[2] * f[2],
    ];

    // Depth window of the margin along forward.
    const pp: [number, number, number] = project(p);
    let near: number = Infinity;
    let far: number = -Infinity;
    const outline: [number, number][] = margin.map(
      (q: Readonly<Point>): [number, number] => {
        const r: [number, number, number] = project(q);
        near = Math.min(near, r[2]);
        far = Math.max(far, r[2]);
        return [r[0], r[1]];
      },
    );
    if (pp[2] < near - aperture.depth || pp[2] > far + aperture.depth)
      return false;

    // Even-odd ray test in the projection plane.
    let odd: boolean = false;
    for (let i: number = 0, j: number = outline.length - 1; i < outline.length; j = i++) {
      const a: [number, number] = outline[i]!;
      const b: [number, number] = outline[j]!;
      if (
        a[1] > pp[1] !== b[1] > pp[1] &&
        pp[0] < ((b[0] - a[0]) * (pp[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        odd = !odd;
    }
    return odd;
  }

  /** Margin samples used by the polyline. */
  const SAMPLES: number = 720;
}

