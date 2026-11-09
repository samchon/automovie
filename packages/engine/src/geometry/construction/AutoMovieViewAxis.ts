import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieAxisDirection } from "./AutoMovieAxisDirection";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";
import { AutoMovieViewJointedCourse } from "./AutoMovieViewJointedCourse";

/** World point or direction triple; lengths use kernel mm. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** Shared scale-safe vector operations used by every axis builder. */
const { add, cross, dot, scale, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/** A vector scaled to length 1; a zero vector stays zero, which no regular axis meets. */
function unit(a: Vec3): Vec3 {
  return AutoMovieAxisDirection.unit(a);
}

/** Unit projection in an admitted tangent's normal plane, with shared scale-safe numeric ownership. */
function projectUnitDirection(a: Vec3, tangent: Vec3): Vec3 {
  const projected: AutoMovieAxisDirection.IProjection =
    AutoMovieAxisDirection.project(a, tangent);
  return AutoMovieAxisDirection.unit(projected.vector, projected.normalNorm);
}

/**
 * Source section planes of the view-to-section operator (`AutoMovieViewLoft`).
 * Straight/horizontal axes have fixed chart directions; level planes remain
 * horizontal while their origins drift. Jointed planes follow their course's
 * quintic-angle turns. Each analytic owner provides derivatives of that same
 * frame in station or an explicitly selected pole coordinate.
 *
 * A section lies square to the part's axis: its origin on the axis, its chart
 * axes `u` and `v` orthonormal in the plane, and the axis direction their
 * frame normal `v x u` (up for a horizontal layer, as
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
 *
 * @evidence contracts/common.md#principled-implementation Reads each declared plane law directly: affine or level origins, analytic jointed turns, or numerical minimal transport. Level plane normals need not follow the drifting origin's tangent.
 * @evidence contracts/common.md#clear-and-simple-design One axis interface and one builder per axis kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An inadmissible jointed axis returns its rule; the turn is never shortened to fit.
 * @evidence contracts/common.md#meaningful-documentation States each axis's frame, station and continuity.
 * @evidence contracts/performance.md#efficient-algorithms Straight frames use constant work; level queries scan their two prepared scalar splines, curved queries march bounded steps and jointed queries integrate preceding turns by fixed Gauss-Legendre panels.
 * @evidence contracts/performance.md#reuse-equivalent-work Each jointed turn's set-back is integrated once when the axis is built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the axis's knots, splines or turns only.
 */
export namespace AutoMovieViewAxis {
  /**
   * A source section plane with optional analytic station derivatives.
   *
   * @evidence contracts/common.md#principled-implementation at reads the actual source plane; jet, when supplied, differentiates that same source instead of a resampled frame spline.
   * @evidence contracts/common.md#clear-and-simple-design Value-only axes remain supported and analytic owners add one explicitly optional callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing analytic derivatives remain absent; a numerical minimal-rotation frame does not acquire an exact jet guarantee.
   * @evidence contracts/common.md#meaningful-documentation Callers must keep source data immutable; jet may return null at a singular or unrepresentable station.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface executes no evaluation; each builder states its preparation/query cost.
   * @evidence contracts/performance.md#reuse-equivalent-work One immutable prepared source supplies both callbacks and can be retained by the loft's explicit source record.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A retaining caller owns the axis and its prepared source dependencies; returned values belong to that caller.
   */
  export interface IAxis {
    /**
     * The section plane at a station.
     *
     * @param station Station along the part, mm.
     * @returns Origin on the axis and orthonormal chart axes, world mm.
     *
     * @evidence contracts/common.md#principled-implementation Evaluates the actual source plane at the requested station.
     * @evidence contracts/common.md#clear-and-simple-design One value callback supports both analytic and numerical source owners.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Values do not imply an available finite station jet.
     * @evidence contracts/common.md#meaningful-documentation States source-plane output and kernel station units.
     * @evidenceExclude contracts/performance.md#efficient-algorithms Signature only; its builder states actual query cost.
     * @evidence contracts/performance.md#reuse-equivalent-work Calls share the axis's immutable preparation.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Returned vectors belong to the caller; the axis retains its prepared source.
     */
    at(station: number): AutoMovieLoftFrame.IFrame;

    /**
     * Analytic value and two derivatives in station or the explicitly selected coordinate, whose endpoints use kernel mm; null at a singular/nonfinite query, absent on numerical frame-value owners.
     *
     * @evidence contracts/common.md#principled-implementation Differentiates the same source law rather than resampled frame values.
     * @evidence contracts/common.md#clear-and-simple-design Optional support and nullable singular readings are distinct states.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite derivative is invented at a parameter pole.
     * @evidence contracts/common.md#meaningful-documentation States absence, singularity and derivative-coordinate meaning.
     * @evidenceExclude contracts/performance.md#efficient-algorithms Signature only; the actual source chooses its analytic evaluation.
     * @evidence contracts/performance.md#reuse-equivalent-work Shares the immutable source used by at.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Returned jet vectors belong to the caller; the callback owns no separate cache.
     */
    jet?(
      station: number,
      parameter?: AutoMovieConstructionOutlineParameter,
    ): AutoMovieViewAxisJet.IJet | null;
  }

  /**
   * One source point of a curved axis in world mm.
   *
   * @evidence contracts/common.md#principled-implementation A station/point pair defines an original natural-curve datum.
   * @evidence contracts/common.md#clear-and-simple-design One scalar and one triple carry each knot.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No frame derivative is inferred by the record itself.
   * @evidence contracts/common.md#meaningful-documentation Members state units and increasing station order.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Input data executes no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Input data schedules no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The source caller owns its finite knot list.
   */
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
   *
   * @evidence contracts/common.md#principled-implementation Moves the origin affinely along v-cross-u with fixed supplied chart directions and their exact zero derivatives.
   * @evidence contracts/common.md#clear-and-simple-design Value and jet callbacks share one affine frame reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied directions are caller-admitted; no fitted plane replaces them.
   * @evidence contracts/common.md#meaningful-documentation States mm station/origin and fixed chart directions.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and fixed output storage per read.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes the normal once for all queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The immutable input vectors live with the axis; returned vectors are fresh.
   */
  export function straight(origin: Vec3, u: Vec3, v: Vec3): IAxis {
    const w: Vec3 = cross(v, u);
    const at: (station: number) => AutoMovieLoftFrame.IFrame = (
      station: number,
    ): AutoMovieLoftFrame.IFrame => ({
      origin: add(origin, scale(w, station)),
      u: [...u],
      v: [...v],
    });
    return {
      at,
      jet: (
        station: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AutoMovieViewAxisJet.IJet | null =>
        AutoMovieViewAxisJet.parameter(
          AutoMovieViewAxisJet.fixed(at(station), w, [0, 0, 0]),
          parameter,
          station,
        ),
    };
  }

  /**
   * The level plane at each world height, the station: the framed twin of
   * an unframed chain's layer (`AutoMovieLoftFrame.horizontal`).
   *
   * @returns The axis.
   *
   * @evidence contracts/common.md#principled-implementation Specializes the straight owner to world height with u=+X and v=+Z.
   * @evidence contracts/common.md#clear-and-simple-design Delegates value and derivative ownership to straight.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the documented world frame without a source-dependent replacement.
   * @evidence contracts/common.md#meaningful-documentation States horizontal plane directions and station meaning.
   * @evidence contracts/performance.md#efficient-algorithms Constant builder and straight-query work.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared straight axis serves every station.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned fixed-size axis closure is retained.
   */
  export function horizontal(): IAxis {
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
   *
   * @evidence contracts/common.md#principled-implementation Natural scalar offsets define (x(s),s,z(s)); analytic derivatives preserve fixed world-level planes.
   * @evidence contracts/common.md#clear-and-simple-design Two prepared source splines serve one value/jet pair.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps actual knot interpolation and explicit end-tangent extension without sampled plane fitting.
   * @evidence contracts/common.md#meaningful-documentation States increasing mm station/offset knots and exterior tangent behavior.
   * @evidence contracts/performance.md#efficient-algorithms Linear knot preparation; queries scan the two prepared natural sources.
   * @evidence contracts/performance.md#reuse-equivalent-work Both callbacks share the two curvature preparations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The axis owns its two prepared knot-sized splines; query outputs are local.
   */
  export function level(
    x: readonly IAxisKnot1[],
    z: readonly IAxisKnot1[],
  ): IAxis {
    const spline: (
      knots: readonly IAxisKnot1[],
    ) => AutoMovieNaturalSpline.ISpline = (
      knots: readonly IAxisKnot1[],
    ): AutoMovieNaturalSpline.ISpline =>
      AutoMovieNaturalSpline.create(
        knots.map((k: IAxisKnot1): number => k.station),
        knots.map((k: IAxisKnot1): number => k.value),
      );
    const sx: AutoMovieNaturalSpline.ISpline = spline(x);
    const sz: AutoMovieNaturalSpline.ISpline = spline(z);
    const at: (station: number) => AutoMovieLoftFrame.IFrame = (
      station: number,
    ): AutoMovieLoftFrame.IFrame => ({
      origin: [
        AutoMovieNaturalSpline.evaluate(sx, station),
        station,
        AutoMovieNaturalSpline.evaluate(sz, station),
      ],
      u: [1, 0, 0],
      v: [0, 0, 1],
    });
    return {
      at,
      jet: (
        station: number,
        parameter?: AutoMovieConstructionOutlineParameter,
      ): AutoMovieViewAxisJet.IJet | null => {
        const dx: [number, number] = AutoMovieNaturalSpline.derivative(
          sx,
          station,
        );
        const dz: [number, number] = AutoMovieNaturalSpline.derivative(
          sz,
          station,
        );
        return AutoMovieViewAxisJet.parameter(
          AutoMovieViewAxisJet.fixed(
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
   * One mm-valued source offset at a mm station.
   *
   * @evidence contracts/common.md#principled-implementation A scalar knot specifies one original level-course offset.
   * @evidence contracts/common.md#clear-and-simple-design Two numbers carry the scalar source datum.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record neither validates station order nor invents derivative data.
   * @evidence contracts/common.md#meaningful-documentation Both members state kernel mm units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Input data executes no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source datum coordinates no work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns its finite source knot list.
   */
  export interface IAxisKnot1 {
    /** Station, mm, strictly increasing over the knots. */
    station: number;

    /** The value there, mm. */
    value: number;
  }

  /**
   * A jointed axis: straight along each segment between consecutive centres,
   * and at each interior centre a turn from one segment's direction to the
   * next about their common normal, the turned angle the quintic smoothstep
   * `10 x^3 - 15 x^4 + 6 x^5` of the share `x` of the turn's arclength
   * `2 h`, so the tangent and the frames are C2.
   *
   * The station is the arclength of the course from the first centre. The
   * turn is symmetric about its corner's bisector, so it leaves the two
   * segments' lines at the set-back `d` from the centre: its displacement
   * `D = integral of t` over the turn is `d (t_in + t_out)`. The chart axis
   * `u` starts as `up` square to the first segment and turns with every
   * joint's rotation (minimal rotation for a planar turn), `v = u x t`.
   * Subnormal or unrepresentable raw projections are recomputed after max-component
   * direction scaling; ordinary projected norms retain their existing arithmetic.
   *
   * @param centres The first end, the joints and the last end, mm.
   * @param halves Each interior centre's finite nonnegative half arclength, mm; positive for a nonzero turn, ignored for an exactly straight joint.
   * @param up The chart's first axis at the first segment, with finite norm and a normal projection longer than 1e-9 of its norm; this existing numerical conditioning policy is stricter than exact nonparallelism.
   * @returns The axis, or the broken admission rule.
   *
   * @evidence contracts/common.md#principled-implementation Transports a frame through quintic-angle turns parameterized by arclength; exact parallel segments have no turn or setback, while atan2 of normalized cross magnitude and dot retains representable small nonzero angles that acos(dot) can lose.
   * @evidence contracts/common.md#clear-and-simple-design Uses one admitted course for frames and published straight runs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonzero turn requires positive half arclength; exact zero turns consume no length and near-parallel turns are not thresholded away.
   * @evidence contracts/common.md#meaningful-documentation States arclength, initial frame, turn law, setback and explicit admission failure.
   * @evidence contracts/performance.md#efficient-algorithms Course preparation is linear in centres with fixed quadrature per nonzero turn; a frame query walks preceding turns and repeats fixed quadrature for each nonzero one, including completed turns.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepares each turn's angle, axis and full setback once for all frame queries.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned axis owns its finite course arrays; frame query vectors are local and no global cache retains an axis.
   */
  export function jointed(
    centres: readonly Vec3[],
    halves: readonly number[],
    up: Vec3,
  ): IAxis | string {
    const c: AutoMovieViewJointedCourse.ICourse | string =
      AutoMovieViewJointedCourse.prepare(centres, halves);
    if (typeof c === "string") return c;
    const { directions, turns }: AutoMovieViewJointedCourse.ICourse = c;
    const upNorm: number = Math.hypot(...up);
    if (!up.every(Number.isFinite) || !Number.isFinite(upNorm) || !(upNorm > 0))
      return "up is not a finite nonzero direction";
    const projected: AutoMovieAxisDirection.IProjection =
      AutoMovieAxisDirection.project(up, directions[0]!, upNorm);
    if (!Number.isFinite(projected.normalNorm))
      return "up normal projection is not finitely representable";
    if (!(projected.normalNorm > 1e-9 * projected.targetNorm))
      return `up relative normal projection ${projected.normalNorm / projected.targetNorm} must exceed 1e-9 for direction conditioning`;
    const first: Vec3 = AutoMovieAxisDirection.unit(
      projected.vector,
      projected.normalNorm,
    );

    return AutoMovieViewJointedCourse.create(
      centres[0]!,
      directions[0]!,
      first,
      turns,
    );
  }

  /**
   * One segment's straight run on a jointed axis: where along the segment the course runs on its line, and the stations there. Outside the run the course is in a turn and cuts the corner inside the segment's line.
   *
   * @evidence contracts/common.md#principled-implementation A point at a distance along a segment's straight run stands at the run's start station plus that distance past the run's start, because the course is the segment's own line there and its station is arclength.
   * @evidence contracts/common.md#clear-and-simple-design Four numbers: the run's two ends as distances from the segment's first centre and as stations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A point inside a turn has no station on the segment's line; the run says where that begins rather than guessing one.
   * @evidence contracts/common.md#meaningful-documentation States each field, its unit and what lies outside the run.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; `runs` builds it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record without computed state.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four numbers per segment, owned by the caller.
   */
  export interface IRun {
    /** Distance from the segment's first centre where the run starts, mm: the previous turn's set-back, 0 on the first segment. */
    from: number;

    /** Distance from the segment's first centre where the run ends, mm: the segment's length less the next turn's set-back. */
    to: number;

    /** The station at `from`, mm. */
    start: number;

    /** The station at `to`, mm. */
    end: number;
  }

  /**
   * Each segment's straight run on a jointed axis, so a caller places a site given as a share of a bone at its station: the station of the point at distance `x` along segment `i` is `start + (x - from)` for `x` in `[from, to]`.
   *
   * @evidence contracts/common.md#principled-implementation The runs come from the same course the axis frames are read from (its turns' set-backs and arclengths), so a station placed by a run is the station `jointed` reads at that point.
   * @evidence contracts/common.md#clear-and-simple-design One run per segment from the same centres and half lengths `jointed` takes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An inadmissible course returns its rule exactly as `jointed` does.
   * @evidence contracts/common.md#meaningful-documentation States the runs, the station formula and the failure.
   * @evidence contracts/performance.md#efficient-algorithms One course build: a fixed Gauss-Legendre quadrature per turn and a linear pass over the segments.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the course builder with `jointed` instead of repeating the set-back integral.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the runs; the course is released with the call.
   * @param centres The first end, the joints and the last end, mm.
   * @param halves Each interior centre's turn half length, mm.
   * @returns The runs, or the broken admission rule.
   */
  export function runs(
    centres: readonly Vec3[],
    halves: readonly number[],
  ): IRun[] | string {
    const c: AutoMovieViewJointedCourse.ICourse | string =
      AutoMovieViewJointedCourse.prepare(centres, halves);
    if (typeof c === "string") return c;
    return c.lengths.map((length: number, i: number): IRun => {
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
    });
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
   *
   * @evidence contracts/common.md#principled-implementation Applies Wang et al.'s double-reflection RMF to the natural component splines and their analytic tangents, with scale-safe direction/reflection arithmetic. The caller supplies increasing finite knots, a regular nonzero tangent, a usable initial normal projection and a finite positive step. This numerical transported frame is not an exact frame-jet API or a repair of inadmissible curves.
   * @evidence contracts/common.md#clear-and-simple-design Three prepared coordinate splines and one initial projected direction define station-local frame queries; no second curve or transport registry is introduced.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the original two Householder reflections rather than a fitted frame or world-axis substitution; exceptional norm scaling preserves the same reflection plane, and only an exactly zero chord retains the prior direction.
   * @evidence contracts/common.md#meaningful-documentation States natural station interpolation, initial projection, step, tangent extension, caller premises and the numerical frame-value limitation.
   * @evidence contracts/performance.md#efficient-algorithms Prepares three natural splines in linear knot work; each query marches ceil(abs(station-first)/step) steps and performs constant component-spline reads per step. Independent queries repeat this march, so distant stations or tiny steps can be expensive.
   * @evidence contracts/performance.md#reuse-equivalent-work All queries share the prepared component splines and initial projected up; each independently reconstructs its transport from the first knot, without assuming another query's trajectory is equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned axis retains three knot-sized splines and fixed initial vectors. A query holds fixed-size working vectors while allocating transient vectors per step; it retains no station cache or external resource after returning.
   */
  export function minimal(
    knots: readonly IAxisKnot[],
    u: Vec3,
    step: number,
  ): IAxis {
    const stations: number[] = knots.map((k: IAxisKnot): number => k.station);
    const splines: AutoMovieNaturalSpline.ISpline[] = [0, 1, 2].map(
      (c: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(
          stations,
          knots.map((k: IAxisKnot): number => k.point[c]!),
        ),
    );
    const point: (s: number) => Vec3 = (s: number): Vec3 =>
      splines.map((p: AutoMovieNaturalSpline.ISpline): number =>
        AutoMovieNaturalSpline.evaluate(p, s),
      ) as Vec3;
    const tangent: (s: number) => Vec3 = (s: number): Vec3 =>
      unit(
        splines.map(
          (p: AutoMovieNaturalSpline.ISpline): number =>
            AutoMovieNaturalSpline.derivative(p, s)[0],
        ) as Vec3,
      );

    // The frame at the first knot: u square to the tangent there.
    const s0: number = stations[0]!;
    const t0: Vec3 = tangent(s0);
    const u0: Vec3 = projectUnitDirection(u, t0);

    // Double reflection from (s, r) to s + h: reflect by the chord, then by
    // the difference of the reflected tangent and the new one.
    const reflect: (s: number, r: Vec3, h: number) => Vec3 = (
      s: number,
      r: Vec3,
      h: number,
    ): Vec3 => {
      const x0: Vec3 = point(s);
      const x1: Vec3 = point(s + h);
      const t: Vec3 = tangent(s);
      const t1: Vec3 = tangent(s + h);
      const v1: Vec3 = sub(x1, x0);
      const c1: number = dot(v1, v1);
      if (c1 === 0 && v1.every((value: number): boolean => value === 0))
        return r;
      const rL: Vec3 = AutoMovieAxisDirection.reflect(r, v1, c1);
      const tL: Vec3 = AutoMovieAxisDirection.reflect(t, v1, c1);
      const v2: Vec3 = sub(t1, tL);
      const c2: number = dot(v2, v2);
      return AutoMovieAxisDirection.reflect(rL, v2, c2);
    };

    const at: (station: number) => AutoMovieLoftFrame.IFrame = (
      station: number,
    ): AutoMovieLoftFrame.IFrame => {
      // March from the first knot in equal steps no longer than `step`,
      // so a station's frame depends on the station alone.
      const span: number = station - s0;
      const n: number = Math.max(1, Math.ceil(Math.abs(span) / step));
      const h: number = span / n;
      let r: Vec3 = u0;
      for (let i: number = 0; i < n; i++) r = reflect(s0 + i * h, r, h);
      const t: Vec3 = tangent(station);
      const ru: Vec3 = projectUnitDirection(r, t);
      return { origin: point(station), u: ru, v: cross(ru, t) };
    };
    return { at };
  }

  /**
   * The axis direction of a plane, `v x u`, its length 1 for orthonormal axes.
   *
   * @param frame The plane.
   * @returns The direction stations advance along.
   *
   * @evidence contracts/common.md#principled-implementation Uses the declared chart orientation v-cross-u.
   * @evidence contracts/common.md#clear-and-simple-design One shared vector cross product returns the direction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not normalize a malformed frame into an admitted one.
   * @evidence contracts/common.md#meaningful-documentation States orientation and unit-length premise.
   * @evidence contracts/performance.md#efficient-algorithms Fixed triple arithmetic takes constant work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure vector reading coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh triple and retains nothing.
   */
  export function normal(frame: AutoMovieLoftFrame.IFrame): Vec3 {
    return cross(frame.v, frame.u);
  }
}
