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
 * Five axes:
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
 * - {@link level}: the level planes with their origin on a horizontal course
 *   in height, for a part whose sections drift sideways with height.
 * - {@link jointed}: a part straight along each segment and turning C2 at
 *   each joint (a limb along its bones), its station the arclength.
 *
 * @evidence contracts/common.md#principled-implementation Sections lie square to the part's own axis: straight, level, curved by minimal rotation, or jointed with C2 smoothstep turns, so no section twists about the axis.
 * @evidence contracts/common.md#clear-and-simple-design One axis interface and one builder per axis kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An inadmissible jointed axis returns its rule; the turn is never shortened to fit.
 * @evidence contracts/common.md#meaningful-documentation States each axis's frame, station and continuity.
 * @evidence contracts/performance.md#efficient-algorithms Straight and level frames are constant work; the curved axis marches bounded steps; the jointed axis integrates each turn by fixed Gauss-Legendre panels.
 * @evidence contracts/performance.md#reuse-equivalent-work Each jointed turn's set-back is integrated once when the axis is built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the axis's knots, splines or turns only.
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
   * The level plane at each world height, its origin on a horizontal course:
   * `(x(s), s, z(s))` with `u = +X` and `v = +Z`, the course's two offsets
   * natural cubic splines of the height, so the origin drifts C2 while every
   * plane stays level.
   *
   * @param x The origin's `x` knots by strictly increasing height, mm.
   * @param z The origin's `z` knots by strictly increasing height, mm.
   * @returns The axis; past the end knots each offset continues straight.
   */
  export function level(x: readonly IAxisKnot1[], z: readonly IAxisKnot1[]): IAxis {
    const spline = (knots: readonly IAxisKnot1[]): AutoMovieNaturalSpline.ISpline =>
      AutoMovieNaturalSpline.create(
        knots.map((k: IAxisKnot1): number => k.station),
        knots.map((k: IAxisKnot1): number => k.value),
      );
    const sx: AutoMovieNaturalSpline.ISpline = spline(x);
    const sz: AutoMovieNaturalSpline.ISpline = spline(z);
    return {
      at: (station: number): AutoMovieLoftFrame.IFrame => ({
        origin: [AutoMovieNaturalSpline.evaluate(sx, station), station, AutoMovieNaturalSpline.evaluate(sz, station)],
        u: [1, 0, 0],
        v: [0, 0, 1],
      }),
    };
  }

  /** One knot of a scalar course: a value at a station. */
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
   *
   * @param centres The first end, the joints and the last end, mm.
   * @param halves Each interior centre's turn half length, mm, positive.
   * @param up The chart's first axis at the first segment.
   * @returns The axis, or the broken admission rule.
   */
  export function jointed(centres: readonly Vec3[], halves: readonly number[], up: Vec3): IAxis | string {
    const c: ICourse | string = course(centres, halves);
    if (typeof c === "string") return c;
    const { directions, turns }: ICourse = c;
    const u0: Vec3 = sub(up, scale(directions[0]!, dot(up, directions[0]!)));
    const lu: number = Math.hypot(u0[0], u0[1], u0[2]);
    if (!(lu > 1e-9 * Math.hypot(up[0], up[1], up[2]))) return "up lies along the first segment";
    const first: Vec3 = scale(u0, 1 / lu);

    return {
      at: (station: number): AutoMovieLoftFrame.IFrame => {
        // Walk the segments and turns up to the station.
        let point: Vec3 = [...centres[0]!];
        let u: Vec3 = first;
        let tangent: Vec3 = directions[0]!;
        let at: number = 0;
        for (let i: number = 0; i < turns.length; i++) {
          const t: ITurn = turns[i]!;
          if (station <= t.start) break;
          point = add(point, scale(tangent, t.start - at));
          at = t.start;
          const share: number = Math.min(2 * t.half, station - at);
          if (t.angle > 0) {
            point = add(point, integrate(tangent, t, share));
            const turned: number = t.angle * smoothstep(share / (2 * t.half));
            u = rotate(u, t.axis, turned);
            tangent = rotate(tangent, t.axis, turned);
          } else point = add(point, scale(tangent, share));
          at += share;
          if (share < 2 * t.half) return frame(point, u, tangent);
        }
        return frame(add(point, scale(tangent, station - at)), u, tangent);
      },
    };
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
  export function runs(centres: readonly Vec3[], halves: readonly number[]): IRun[] | string {
    const c: ICourse | string = course(centres, halves);
    if (typeof c === "string") return c;
    return c.lengths.map((length: number, i: number): IRun => {
      const before: number = i >= 1 ? c.turns[i - 1]!.setback : 0;
      const after: number = i < c.turns.length ? c.turns[i]!.setback : 0;
      const start: number = i === 0 ? 0 : c.turns[i - 1]!.start + 2 * c.turns[i - 1]!.half;
      return { from: before, to: length - after, start, end: start + length - before - after };
    });
  }

  /** A jointed course: its segments' directions and lengths and its turns. */
  interface ICourse {
    /** Each segment's unit direction. */
    directions: Vec3[];

    /** Each segment's length, mm. */
    lengths: number[];

    /** Each interior centre's turn. */
    turns: ITurn[];
  }

  /** The course through the centres, or the broken admission rule. */
  function course(centres: readonly Vec3[], halves: readonly number[]): ICourse | string {
    const m: number = centres.length;
    if (m < 2) return `${m} centres, at least two needed`;
    if (halves.length !== m - 2) return `${halves.length} half lengths for ${m - 2} interior centres`;
    const directions: Vec3[] = [];
    const lengths: number[] = [];
    for (let i: number = 0; i + 1 < m; i++) {
      const d: Vec3 = sub(centres[i + 1]!, centres[i]!);
      const l: number = Math.hypot(d[0], d[1], d[2]);
      if (!(l > 0)) return `centres ${i} and ${i + 1} coincide`;
      directions.push(scale(d, 1 / l));
      lengths.push(l);
    }

    // Each turn's axis, angle and set-back.
    const turns: ITurn[] = [];
    for (let i: number = 1; i + 1 < m; i++) {
      const h: number = halves[i - 1]!;
      if (!(h > 0)) return `half length ${h} at centre ${i} is not positive`;
      const a: Vec3 = directions[i - 1]!;
      const b: Vec3 = directions[i]!;
      const c: number = Math.max(-1, Math.min(1, dot(a, b)));
      const angle: number = Math.acos(c);
      if (!(angle < Math.PI - 1e-9)) return `segments ${i - 1} and ${i} are opposite`;
      const n: Vec3 = cross(a, b);
      const ln: number = Math.hypot(n[0], n[1], n[2]);
      const axis: Vec3 = ln > 0 ? scale(n, 1 / ln) : [0, 0, 0];
      const turn: ITurn = { centre: i, half: h, angle: ln > 0 ? angle : 0, axis, setback: h, start: 0 };
      if (turn.angle > 0) {
        const displacement: Vec3 = integrate(a, turn, 2 * h);
        // D = d (a + b): read d along the bisector a + b.
        const bisector: Vec3 = add(a, b);
        turn.setback = dot(displacement, bisector) / dot(bisector, bisector);
      }
      turns.push(turn);
    }
    for (let i: number = 0; i + 1 < m; i++) {
      const before: number = i >= 1 ? turns[i - 1]!.setback : 0;
      const after: number = i + 1 < m - 1 ? turns[i]!.setback : 0;
      if (!(before + after < lengths[i]!)) return `the turns' set-backs ${before} and ${after} overrun segment ${i} of length ${lengths[i]}`;
    }

    // Arclength of each turn's start.
    let s: number = 0;
    for (let i: number = 0; i < turns.length; i++) {
      const t: ITurn = turns[i]!;
      const previous: number = i >= 1 ? turns[i - 1]!.setback : 0;
      s += lengths[i]! - previous - t.setback;
      t.start = s;
      s += 2 * t.half;
    }
    return { directions, lengths, turns };
  }

  /** One turn of a jointed axis. */
  interface ITurn {
    /** Its centre's index. */
    centre: number;

    /** Half its arclength, mm. */
    half: number;

    /** The angle it turns, radians, 0 for parallel segments. */
    angle: number;

    /** The unit axis it turns about. */
    axis: Vec3;

    /** Its set-back from the centre along both segments, mm. */
    setback: number;

    /** The arclength where it starts, mm. */
    start: number;
  }

  /** The plane square to a tangent, its first axis `u` and `v = u x t`. */
  function frame(origin: Vec3, u: Vec3, tangent: Vec3): AutoMovieLoftFrame.IFrame {
    return { origin, u: [...u], v: cross(u, tangent) };
  }

  /** `10 x^3 - 15 x^4 + 6 x^5` on `[0, 1]`. */
  function smoothstep(x: number): number {
    const c: number = Math.min(1, Math.max(0, x));
    return c * c * c * (10 + c * (-15 + 6 * c));
  }

  /** A vector turned about a unit axis by an angle (Rodrigues). */
  function rotate(a: Vec3, axis: Vec3, angle: number): Vec3 {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return add(add(scale(a, c), scale(cross(axis, a), s)), scale(axis, dot(axis, a) * (1 - c)));
  }

  /** Gauss-Legendre nodes and weights on `[-1, 1]`, ten points. */
  const GAUSS: readonly (readonly [number, number])[] = [
    [-0.9739065285171717, 0.0666713443086881],
    [-0.8650633666889845, 0.1494513491505806],
    [-0.6794095682990244, 0.219086362515982],
    [-0.4333953941292472, 0.2692667193099963],
    [-0.1488743389816312, 0.2955242247147529],
    [0.1488743389816312, 0.2955242247147529],
    [0.4333953941292472, 0.2692667193099963],
    [0.6794095682990244, 0.219086362515982],
    [0.8650633666889845, 0.1494513491505806],
    [0.9739065285171717, 0.0666713443086881],
  ];

  /** Panels of the turn's displacement quadrature. */
  const PANELS: number = 8;

  /**
   * The displacement along a turn from its start over an arclength: the
   * integral of the turning tangent, by composite ten-point Gauss-Legendre
   * on {@link PANELS} panels, exact to rounding for the smooth integrand.
   */
  function integrate(tangent: Vec3, turn: ITurn, length: number): Vec3 {
    let sum: Vec3 = [0, 0, 0];
    const width: number = length / PANELS;
    for (let p: number = 0; p < PANELS; p++)
      for (const [x, w] of GAUSS) {
        const sigma: number = width * (p + (x + 1) / 2);
        const turned: number = turn.angle * smoothstep(sigma / (2 * turn.half));
        sum = add(sum, scale(rotate(tangent, turn.axis, turned), (w * width) / 2));
      }
    return sum;
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
