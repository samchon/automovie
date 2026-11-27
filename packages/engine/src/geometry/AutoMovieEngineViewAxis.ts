import type {
  AutoMovieVector3Tuple,
  IAutoMovieAxisDirection,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftSectionFrame,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

import { AutoMovieEngineAxisDirection } from "./AutoMovieEngineAxisDirection";
import { AutoMovieEngineNaturalSpline } from "./AutoMovieEngineNaturalSpline";
import { AutoMovieEngineSolidVector } from "./AutoMovieEngineSolidVector";
import { AutoMovieEngineViewAxisJet } from "./AutoMovieEngineViewAxisJet";
import { AutoMovieEngineViewJointedCourse } from "./AutoMovieEngineViewJointedCourse";

/**
 * Source section planes of the view-to-section operator (`AutoMovieEngineViewLoft`).
 * Straight/horizontal axes have fixed chart directions; level planes remain
 * horizontal while their origins drift. Jointed planes follow their course's
 * quintic-angle turns. Each analytic owner provides derivatives of that same
 * frame in station or an explicitly selected pole coordinate.
 *
 * A section lies square to the part's axis: its origin on the axis, its chart
 * axes `u` and `v` orthonormal in the plane, and the axis direction their frame
 * normal `v x u` (up for a horizontal layer, as
 * `IAutoMovieLoftChain.ILayer.lift` reads it). Where an axis supplies
 * {@link IAxis.jet}, the operator reads the plane's first and second station
 * derivatives, so the chain's quintic station rule reproduces a straight run
 * exactly and follows a turn or a curve by its own derivatives.
 *
 * Minimal transport supplies frame values through Wang, Juttler, Zheng and
 * Liu's double-reflection method (ACM TOG 27(1), 2008), with its stated
 * regular-curve and positive-step premises; its jet differentiates the
 * rotation-minimizing frame law (`u' = -(u . t') t`) at the transported value.
 * Each builder below owns its station, orientation and admission rule.
 */
export namespace AutoMovieEngineViewAxis {
  /**
   * A straight axis: the plane at station 0 moved along its normal `v x u`.
   *
   * @param origin The axis point at station 0, world mm.
   * @param u The chart's `x` axis, unit.
   * @param v The chart's `z` axis, unit and square to `u`.
   * @returns The axis.
   */
  export function straight(
    origin: AutoMovieVector3Tuple,
    u: AutoMovieVector3Tuple,
    v: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis {
    const w: AutoMovieVector3Tuple = cross(v, u);
    const at: (station: number) => IAutoMovieLoftSectionFrame = (
      station: number,
    ): IAutoMovieLoftSectionFrame => ({
      origin: add(origin, scale(w, station)),
      u: [...u],
      v: [...v],
    });
    return {
      at,
      jet: (
        station: number,
        parameter?: IAutoMovieConstructionOutlineParameter,
      ): IAutoMovieViewAxisJet.IJet | null =>
        AutoMovieEngineViewAxisJet.parameter(
          AutoMovieEngineViewAxisJet.fixed(at(station), w, [0, 0, 0]),
          parameter,
          station,
        ),
    };
  }

  /**
   * The level plane at each world height, the station: the framed twin of an
   * unframed chain's layer (`AutoMovieEngineLoftFrame.horizontal`).
   *
   * @returns The axis.
   */
  export function horizontal(): IAutoMovieViewAxis.IAxis {
    return straight([0, 0, 0], [1, 0, 0], [0, 0, 1]);
  }

  /**
   * The level plane at each world height, its origin on a horizontal course:
   * `(x(s), s, z(s))` with `u = +X` and `v = +Z`, the course's two offsets
   * natural cubic splines of the height, so the origin drifts C2 while every
   * plane stays level.
   *
   * @param x The origin's `x` knots by strictly increasing height, mm.
   * @param z The origin's `z` knots by strictly increasing height, mm.
   * @returns The axis; past the end knots each offset continues straight.
   */
  export function level(
    x: readonly IAutoMovieViewAxis.IAxisKnot1[],
    z: readonly IAutoMovieViewAxis.IAxisKnot1[],
  ): IAutoMovieViewAxis.IAxis {
    const spline: (
      knots: readonly IAutoMovieViewAxis.IAxisKnot1[],
    ) => IAutoMovieNaturalCubicSpline = (
      knots: readonly IAutoMovieViewAxis.IAxisKnot1[],
    ): IAutoMovieNaturalCubicSpline =>
      AutoMovieEngineNaturalSpline.create(
        knots.map((k: IAutoMovieViewAxis.IAxisKnot1): number => k.station),
        knots.map((k: IAutoMovieViewAxis.IAxisKnot1): number => k.value),
      );
    const sx: IAutoMovieNaturalCubicSpline = spline(x);
    const sz: IAutoMovieNaturalCubicSpline = spline(z);
    const at: (station: number) => IAutoMovieLoftSectionFrame = (
      station: number,
    ): IAutoMovieLoftSectionFrame => ({
      origin: [
        AutoMovieEngineNaturalSpline.evaluate(sx, station),
        station,
        AutoMovieEngineNaturalSpline.evaluate(sz, station),
      ],
      u: [1, 0, 0],
      v: [0, 0, 1],
    });
    return {
      at,
      jet: (
        station: number,
        parameter?: IAutoMovieConstructionOutlineParameter,
      ): IAutoMovieViewAxisJet.IJet | null => {
        const dx: [number, number] = AutoMovieEngineNaturalSpline.derivative(
          sx,
          station,
        );
        const dz: [number, number] = AutoMovieEngineNaturalSpline.derivative(
          sz,
          station,
        );
        return AutoMovieEngineViewAxisJet.parameter(
          AutoMovieEngineViewAxisJet.fixed(
            at(station),
            [dx[0], 1, dz[0]],
            [dx[1], 0, dz[1]],
          ),
          parameter,
          station,
        );
      },
    };
  }

  /**
   * A jointed axis: straight along each segment between consecutive centres,
   * and at each interior centre a turn from one segment's direction to the next
   * about their common normal, the turned angle the quintic smoothstep `10 x^3
   *
   * - 15 x^4 + 6 x^5`of the share`x`of the turn's arclength`2 h`, so the tangent
   *   and the frames are C2.
   *
   * The station is the arclength of the course from the first centre. The turn
   * is symmetric about its corner's bisector, so it leaves the two segments'
   * lines at the set-back `d` from the centre: its displacement `D = integral
   * of t` over the turn is `d (t_in + t_out)`. The chart axis `u` starts as
   * `up` square to the first segment and turns with every joint's rotation
   * (minimal rotation for a planar turn), `v = u x t`. Subnormal or
   * unrepresentable raw projections are recomputed after max-component
   * direction scaling; ordinary projected norms retain their existing
   * arithmetic.
   *
   * @param centres The first end, the joints and the last end, mm.
   * @param halves Each interior centre's finite nonnegative half arclength, mm;
   *   positive for a nonzero turn, ignored for an exactly straight joint.
   * @param up The chart's first axis at the first segment, with finite norm and
   *   a normal projection longer than 1e-9 of its norm; this existing numerical
   *   conditioning policy is stricter than exact nonparallelism.
   * @returns The axis, or the broken admission rule.
   */
  export function jointed(
    centres: readonly AutoMovieVector3Tuple[],
    halves: readonly number[],
    up: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis | string {
    const c: IAutoMovieViewJointedCourse.ICourse | string =
      AutoMovieEngineViewJointedCourse.prepare(centres, halves);
    if (typeof c === "string") return c;
    const { directions, turns }: IAutoMovieViewJointedCourse.ICourse = c;
    const upNorm: number = Math.hypot(...up);
    if (!(upNorm > 0)) return "up is not a finite nonzero direction";
    const projected: IAutoMovieAxisDirection.IProjection =
      AutoMovieEngineAxisDirection.project(up, directions[0]!, upNorm);
    if (!(projected.normalNorm > 1e-9 * projected.targetNorm))
      return `up relative normal projection ${projected.normalNorm / projected.targetNorm} must exceed 1e-9 for direction conditioning`;
    const first: AutoMovieVector3Tuple = AutoMovieEngineAxisDirection.unit(
      projected.vector,
      projected.normalNorm,
    );

    return AutoMovieEngineViewJointedCourse.create(
      centres[0]!,
      directions[0]!,
      first,
      turns,
    );
  }

  /**
   * Each segment's straight run on a jointed axis, so a caller places a site
   * given as a share of a bone at its station: the station of the point at
   * distance `x` along segment `i` is `start + (x - from)` for `x` in `[from,
   * to]`.
   *
   * @param centres The first end, the joints and the last end, mm.
   * @param halves Each interior centre's turn half length, mm.
   * @returns The runs, or the broken admission rule.
   */
  export function runs(
    centres: readonly AutoMovieVector3Tuple[],
    halves: readonly number[],
  ): IAutoMovieViewAxis.IRun[] | string {
    const c: IAutoMovieViewJointedCourse.ICourse | string =
      AutoMovieEngineViewJointedCourse.prepare(centres, halves);
    if (typeof c === "string") return c;
    return c.lengths.map(
      (length: number, i: number): IAutoMovieViewAxis.IRun => {
        const before: number = i >= 1 ? c.turns[i - 1]!.setback : 0;
        const after: number = i < c.turns.length ? c.turns[i]!.setback : 0;
        const start: number =
          i === 0 ? 0 : c.turns[i - 1]!.start + 2 * c.turns[i - 1]!.half;
        return {
          from: before,
          to: length - after,
          start,
          end: start + length - before - after,
        };
      },
    );
  }

  /**
   * A curved axis: the natural cubic spline of the knots' points in station,
   * each plane square to its tangent, the chart axes carried from the first
   * knot by minimal rotation.
   *
   * @param knots At least two, by strictly increasing station.
   * @param u The chart's `x` axis at the first knot; its part along the tangent
   *   there is removed.
   * @param step Largest station step of the double reflection, mm, positive.
   * @returns The axis; stations past the end knots continue the spline's
   *   straight end tangents.
   */
  export function minimal(
    knots: readonly IAutoMovieViewAxis.IAxisKnot[],
    u: AutoMovieVector3Tuple,
    step: number,
  ): IAutoMovieViewAxis.IAxis {
    const stations: number[] = knots.map(
      (k: IAutoMovieViewAxis.IAxisKnot): number => k.station,
    );
    const splines: IAutoMovieNaturalCubicSpline[] = [0, 1, 2].map(
      (c: number): IAutoMovieNaturalCubicSpline =>
        AutoMovieEngineNaturalSpline.create(
          stations,
          knots.map((k: IAutoMovieViewAxis.IAxisKnot): number => k.point[c]!),
        ),
    );
    const point: (s: number) => AutoMovieVector3Tuple = (
      s: number,
    ): AutoMovieVector3Tuple =>
      splines.map((p: IAutoMovieNaturalCubicSpline): number =>
        AutoMovieEngineNaturalSpline.evaluate(p, s),
      ) as AutoMovieVector3Tuple;
    const tangent: (s: number) => AutoMovieVector3Tuple = (
      s: number,
    ): AutoMovieVector3Tuple =>
      unit(
        splines.map(
          (p: IAutoMovieNaturalCubicSpline): number =>
            AutoMovieEngineNaturalSpline.derivative(p, s)[0],
        ) as AutoMovieVector3Tuple,
      );

    // The frame at the first knot: u square to the tangent there.
    const s0: number = stations[0]!;
    const t0: AutoMovieVector3Tuple = tangent(s0);
    const u0: AutoMovieVector3Tuple = projectUnitDirection(u, t0);

    // Double reflection from (s, r) to s + h: reflect by the chord, then by
    // the difference of the reflected tangent and the new one.
    const reflect: (
      s: number,
      r: AutoMovieVector3Tuple,
      h: number,
    ) => AutoMovieVector3Tuple = (
      s: number,
      r: AutoMovieVector3Tuple,
      h: number,
    ): AutoMovieVector3Tuple => {
      const x0: AutoMovieVector3Tuple = point(s);
      const x1: AutoMovieVector3Tuple = point(s + h);
      const t: AutoMovieVector3Tuple = tangent(s);
      const t1: AutoMovieVector3Tuple = tangent(s + h);
      const v1: AutoMovieVector3Tuple = sub(x1, x0);
      const c1: number = dot(v1, v1);
      if (c1 === 0 && v1.every((value: number): boolean => value === 0))
        return r;
      const rL: AutoMovieVector3Tuple = AutoMovieEngineAxisDirection.reflect(
        r,
        v1,
        c1,
      );
      const tL: AutoMovieVector3Tuple = AutoMovieEngineAxisDirection.reflect(
        t,
        v1,
        c1,
      );
      const v2: AutoMovieVector3Tuple = sub(t1, tL);
      const c2: number = dot(v2, v2);
      return AutoMovieEngineAxisDirection.reflect(rL, v2, c2);
    };

    const at: (station: number) => IAutoMovieLoftSectionFrame = (
      station: number,
    ): IAutoMovieLoftSectionFrame => {
      // March from the first knot in equal steps no longer than `step`,
      // so a station's frame depends on the station alone.
      const span: number = station - s0;
      const n: number = Math.max(1, Math.ceil(Math.abs(span) / step));
      const h: number = span / n;
      let r: AutoMovieVector3Tuple = u0;
      for (let i: number = 0; i < n; i++) r = reflect(s0 + i * h, r, h);
      const t: AutoMovieVector3Tuple = tangent(station);
      const ru: AutoMovieVector3Tuple = projectUnitDirection(r, t);
      return { origin: point(station), u: ru, v: cross(ru, t) };
    };
    return { at };
  }

  /**
   * The axis direction of a plane, `v x u`, its length 1 for orthonormal axes.
   *
   * @param frame The plane.
   * @returns The direction stations advance along.
   */
  export function normal(
    frame: IAutoMovieLoftSectionFrame,
  ): AutoMovieVector3Tuple {
    return cross(frame.v, frame.u);
  }
}

/*
 * Shared scale-safe vector operations used by every axis builder.
 */
const { add, cross, dot, scale, sub }: typeof AutoMovieEngineSolidVector =
  AutoMovieEngineSolidVector;

/*
 * A vector scaled to length 1; a zero vector stays zero, which no regular axis
 * meets.
 */
function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
  return AutoMovieEngineAxisDirection.unit(a);
}

/*
 * Unit projection in an admitted tangent's normal plane, with shared scale-safe
 * numeric ownership.
 */
function projectUnitDirection(
  a: AutoMovieVector3Tuple,
  tangent: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  const projected: IAutoMovieAxisDirection.IProjection =
    AutoMovieEngineAxisDirection.project(a, tangent);
  return AutoMovieEngineAxisDirection.unit(projected.vector, projected.normalNorm);
}
