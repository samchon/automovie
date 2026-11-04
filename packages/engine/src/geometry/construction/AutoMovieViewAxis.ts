import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

type Vec3 = AutoMovieSolidVector.Vec3;
const { add, cross, dot, scale, sub } = AutoMovieSolidVector;

/** A vector scaled to length 1; a zero vector stays zero, which no regular axis meets. */
function unit(a: Vec3): Vec3 {
  const n: number = Math.hypot(a[0], a[1], a[2]);
  return n > 0 ? scale(a, 1 / n) : a;
}

/**
 * A part's own frame along its stations: the section plane at each station of
 * the view-to-section operator (`AutoMovieViewLoft`).
 *
 * A section lies square to the part's axis: its origin on the axis, its chart
 * axes `u` and `v` orthonormal in the plane, and the axis direction their
 * frame normal `v x u` (up for a horizontal layer, as
 * `IAutoMovieLoftChain.ILayer.lift` reads it). The operator reads the
 * frame at every layer station and the chain carries the planes' station
 * derivatives by the natural spline of their components
 * (`AutoMovieSeamStation.continuous`), which is exact for a straight
 * axis (a linear origin and constant axes).
 *
 * Three axes:
 *
 * - {@link straight}: a part straight in its bone frame at the neutral pose
 *   (a limb segment, a phalanx, a nose), the plane moved along `v x u`.
 * - {@link horizontal}: the level plane at each height, `u = +X`, `v = +Z`,
 *   origin `(0, s, 0)`: the framed twin of an unframed chain (the trunk, the
 *   neck), whose layers it reproduces exactly.
 * - {@link minimal}: a curved axis (the spine, the neck's course), the plane
 *   square to the curve's tangent and its axes carried by minimal rotation,
 *   so a section never twists about the axis (Wang, Juttler, Zheng and Liu,
 *   Computation of rotation minimizing frames, ACM TOG 27(1), 2008: the
 *   double reflection method, fourth order in the step).
 */
export namespace AutoMovieViewAxis {
  /** A part's axis: the section plane at a station. */
  export interface IAxis {
    /**
     * The section plane at a station.
     *
     * @param station Station along the part, mm.
     * @returns Origin on the axis and orthonormal chart axes, world mm.
     */
    at(station: number): AutoMovieLoftFrame.IFrame;
  }

  /** One knot of a curved axis. */
  export interface IAxisKnot {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The axis point there, world mm. */
    point: Vec3;
  }

  /**
   * A straight axis: the plane at station 0 moved along its normal `v x u`.
   *
   * @param origin The axis point at station 0, world mm.
   * @param u The chart's `x` axis, unit.
   * @param v The chart's `z` axis, unit and square to `u`.
   * @returns The axis.
   */
  export function straight(origin: Vec3, u: Vec3, v: Vec3): IAxis {
    const w: Vec3 = cross(v, u);
    return {
      at: (station: number): AutoMovieLoftFrame.IFrame => ({
        origin: add(origin, scale(w, station)),
        u: [...u],
        v: [...v],
      }),
    };
  }

  /**
   * The level plane at each world height, the station: the framed twin of
   * an unframed chain's layer (`AutoMovieLoftFrame.horizontal`).
   *
   * @returns The axis.
   */
  export function horizontal(): IAxis {
    return straight([0, 0, 0], [1, 0, 0], [0, 0, 1]);
  }

  /**
   * A curved axis: the natural cubic spline of the knots' points in station,
   * each plane square to its tangent, the chart axes carried from the first
   * knot by minimal rotation.
   *
   * @param knots At least two, by strictly increasing station.
   * @param u The chart's `x` axis at the first knot; its part along the
   *   tangent there is removed.
   * @param step Largest station step of the double reflection, mm, positive.
   * @returns The axis; stations past the end knots continue the spline's
   *   straight end tangents.
   */
  export function minimal(knots: readonly IAxisKnot[], u: Vec3, step: number): IAxis {
    const stations: number[] = knots.map((k: IAxisKnot): number => k.station);
    const splines: AutoMovieNaturalSpline.ISpline[] = [0, 1, 2].map(
      (c: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(
          stations,
          knots.map((k: IAxisKnot): number => k.point[c]!),
        ),
    );
    const point = (s: number): Vec3 =>
      splines.map((p: AutoMovieNaturalSpline.ISpline): number => AutoMovieNaturalSpline.evaluate(p, s)) as Vec3;
    const tangent = (s: number): Vec3 =>
      unit(splines.map((p: AutoMovieNaturalSpline.ISpline): number => AutoMovieNaturalSpline.derivative(p, s)[0]) as Vec3);

    // The frame at the first knot: u square to the tangent there.
    const s0: number = stations[0]!;
    const t0: Vec3 = tangent(s0);
    const u0: Vec3 = unit(sub(u, scale(t0, dot(u, t0))));

    // Double reflection from (s, r) to s + h: reflect by the chord, then by
    // the difference of the reflected tangent and the new one.
    const reflect = (s: number, r: Vec3, h: number): Vec3 => {
      const x0: Vec3 = point(s);
      const x1: Vec3 = point(s + h);
      const t: Vec3 = tangent(s);
      const t1: Vec3 = tangent(s + h);
      const v1: Vec3 = sub(x1, x0);
      const c1: number = dot(v1, v1);
      if (!(c1 > 0)) return r;
      const rL: Vec3 = sub(r, scale(v1, (2 / c1) * dot(v1, r)));
      const tL: Vec3 = sub(t, scale(v1, (2 / c1) * dot(v1, t)));
      const v2: Vec3 = sub(t1, tL);
      const c2: number = dot(v2, v2);
      return c2 > 0 ? sub(rL, scale(v2, (2 / c2) * dot(v2, rL))) : rL;
    };

    return {
      at: (station: number): AutoMovieLoftFrame.IFrame => {
        // March from the first knot in equal steps no longer than `step`,
        // so a station's frame depends on the station alone.
        const span: number = station - s0;
        const n: number = Math.max(1, Math.ceil(Math.abs(span) / step));
        const h: number = span / n;
        let r: Vec3 = u0;
        for (let i: number = 0; i < n; i++) r = reflect(s0 + i * h, r, h);
        const t: Vec3 = tangent(station);
        const ru: Vec3 = unit(sub(r, scale(t, dot(r, t))));
        return { origin: point(station), u: ru, v: cross(ru, t) };
      },
    };
  }

  /**
   * The axis direction of a plane, `v x u`, its length 1 for orthonormal axes.
   *
   * @param frame The plane.
   * @returns The direction stations advance along.
   */
  export function normal(frame: AutoMovieLoftFrame.IFrame): Vec3 {
    return cross(frame.v, frame.u);
  }
}
