import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type Vec4 = [number, number, number, number];
type IJet = IAutoMovieSolidSurface.IJet;
const { add, combine, cross, dot, norm, scale, sub } = AutoMovieSolidVector;

/**
 * The curve where an attached part's surface meets its host's: the
 * surface-surface intersection of the solid merge and diff, traced by a
 * declared parameter `t` over one turn.
 *
 * The part `A(s, phi)` has a periodic phase `phi` (a limb, a digit, a muscle
 * head, a cutter); the host `B(y, theta)` is any surface. A point of the
 * curve solves four equations in the four unknowns `x = (s, phi, y, theta)`:
 *
 * ```text
 * F(x) = A(s, phi) - B(y, theta) = 0      (three, the meeting)
 * g(x, t) = 0                               (one, the parameter)
 * ```
 *
 * by Newton's method with the Jacobian `J = [A_s, A_phi, -B_y, -B_theta; grad g]`
 * (Patrikalakis, Maekawa and Cho, Shape Interrogation for CAD and
 * Manufacturing, ch. 5). Three parameters:
 *
 * - `phase`: `g = phi - t`, the part's phase. Each phase's station line
 *   crosses the host once near the curve: a limb, a digit, the neck.
 * - `angle`: `g = (A - c) . m(t)`, the angle `t` about an axis through the
 *   footprint's centre `c` with normal `n`, `m(t) = -sin t e1 + cos t e2` square
 *   to the half plane of direction `d(t) = cos t e1 + sin t e2` (`e1` the
 *   reference square to `n`, `e2 = n x e1`). A part lying along its host
 *   (a groove, a muscle head, a crease, a nail fold), whose station lines run
 *   along the host and cross it twice or never, is traced so, since every
 *   half plane about its footprint's centre meets the curve once.
 * - `arc`: the curve's own arclength, for a long thin part along its host
 *   (a lid, a lip, a helix rim, a groove) whose half planes about any one
 *   centre cross its curve twice; the loop is first walked by
 *   pseudo-arclength continuation (Allgower and Georg, Numerical
 *   Continuation Methods, 1990, ch. 2) to make the law of its arclength.
 *
 * Differentiating `F(x(t)) = 0` and `g(x(t), t) = 0` gives the curve's exact
 * jet by the implicit function theorem, with no difference of traced points:
 *
 * ```text
 * J x'  = -(0, 0, 0, g_t)
 * J x'' = -(Q_A - Q_B, Q_g)
 * Q_A = A_ss s'^2 + 2 A_sphi s' phi' + A_phiphi phi'^2,  Q_B the same in B
 * Q_g = Q_A . m + 2 P' . m' + (P - c) . m''  (angle; 0 for phase)
 * C'  = A_s s' + A_phi phi',   C'' = Q_A + A_s s'' + A_phi phi''
 * ```
 *
 * with `P = A`, `m' = -d`, `m'' = -m`, `g_t = -(P - c) . d` (angle) or `-1`
 * (phase); each line collects every second-order term of the chain rule
 * except the one linear in `x''`.
 *
 * Tracing is continuation in `t` from a seed (a landmark's feet on both
 * surfaces, refined here by Newton): each step predicts by the second-order
 * Taylor step of that jet and corrects by Newton, and a step whose correction
 * fails, or lands farther from its prediction than a quarter of the step's own
 * length (a jump to another branch), is halved. After one turn of `t` the
 * curve must return to its start, with each phase changed by a whole number
 * of its periods; otherwise it is not one closed loop.
 *
 * `J` is singular exactly where the curve does not cross the parameter's
 * level sets: at a tangential contact (normals parallel), or where the curve
 * turns along the part's stations (phase) or along the half plane (angle).
 * Each is reported, never stepped over.
 */
export namespace AutoMovieSolidIntersection {
  /** One point of the curve with both preimages and their parameter jets. */
  export interface IPoint {
    /** The curve's parameter, radians: the part's phase, or the angle about the footprint's axis. */
    t: number;

    /** The part's phase, radians, unwrapped along the traced curve. */
    phi: number;

    /** The part's station, its `u`. */
    s: number;

    /** The host face the point lies on: 0 for a single surface (`IAutoMovieSolidAtlas`). */
    face: number;

    /** The host's `u`, on that face. */
    y: number;

    /** The host's `v`, unwrapped along the traced curve. */
    theta: number;

    /** The curve's point, mm. */
    point: Vec3;

    /** `dC / dt`, mm per radian. */
    tangent: Vec3;

    /** `d^2 C / dt^2`. */
    second: Vec3;

    /** `[s', phi', y', theta']` per radian of `t`. */
    rate: Vec4;

    /** `[s'', phi'', y'', theta'']`. */
    rate2: Vec4;

    /** Angle between the two surfaces' tangent planes, radians in `[0, pi / 2]`: zero at a tangential contact. */
    angle: number;
  }

  /** The curve's parameter. */
  export type Parameter =
    | { kind: "phase" }
    | {
        kind: "angle";

        /** The footprint's centre, mm. */
        centre: Vec3;

        /** The axis's direction, the host's outward normal there. */
        normal: Vec3;

        /** The direction of `t = 0`; its part along `normal` is removed. */
        reference: Vec3;
      }
    | {
        /**
         * The curve's own arclength over its whole length, times a turn: for a
         * long thin part lying along its host (a lid, a lip, a helix rim, a
         * groove), whose half planes about one centre cross its curve twice.
         * The loop is walked first by pseudo-arclength continuation (each
         * step on the plane square to the curve's tangent at the predicted
         * point), then walked again in equal chords of its length, and the
         * parameter of a point is its foot on the periodic cubic B-spline
         * through those points: `(P - Q(t)) . Q'(t) = 0`.
         */
        kind: "arc";
      };

  /** A traced closed loop. */
  export interface ICurve {
    /** The part's surface name. */
    part: string;

    /** The host's surface name. */
    host: string;

    /** The parameter it is traced by. */
    parameter: Parameter;

    /** The traced points at uniform `t` from the seed, one turn, the start not repeated. */
    points: IPoint[];

    /** Whole turns the host's `v` makes over one turn of `t`; 0 for a loop that encloses a region of the host's chart. */
    winding: number;

    /** Whole turns the part's phase makes over one turn of `t`; 0 for a loop that encloses a region of the part's chart (a part lying along its host). */
    partWinding: number;

    /**
     * The curve at any parameter, corrected by Newton from the nearest
     * traced point.
     *
     * @param t The parameter, radians, any real value.
     * @returns The point, its phases on the branch of the traced point it
     *   starts from, or null where Newton fails there.
     */
    at(t: number): IPoint | null;
  }

  /** What a trace needs. */
  export interface IInput {
    /** The attached part, `v` periodic. */
    part: IAutoMovieSolidSurface;

    /** The host. */
    host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas;

    /** The seed: the part's phase and `[s, y, theta]` near the curve there. */
    seed: { phi: number; s: number; y: number; theta: number; face?: number };

    /** The parameter; absent, the part's phase. */
    parameter?: Parameter;

    /** Traced points over one turn, at least 8. */
    count: number;

    /** Largest gap `|A - B|` accepted at a solution, mm. */
    tolerance: number;

    /** Least angle between the tangent planes, radians, under which a contact is reported as tangential. */
    grazing: number;
  }

  /** A trace's result: the curve, or null with the diagnostics that say why. */
  export interface IResult {
    /** The curve; null when the seed finds no meeting or the loop does not close. */
    curve: ICurve | null;

    /** Every broken premise, with its place and numbers. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Newton steps per solve. */
  export const STEPS: number = 40;

  /** Halvings of one continuation step before the trace is lost. */
  export const HALVINGS: number = 24;

  /**
   * Trace the closed curve from its seed.
   *
   * @param input The two surfaces, the seed, the parameter and the trace's limits.
   * @returns The curve and its diagnostics.
   */
  export function trace(input: IInput): IResult {
    const { part, count, tolerance, grazing }: IInput = input;
    const host: IAutoMovieSolidAtlas = atlas(input.host);
    const parameter: Parameter = input.parameter ?? { kind: "phase" };
    const producer: string = `solid.intersection.${part.name}.${host.name}`;
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const report = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { curve: null, diagnostics };
    };
    if (part.period === undefined) return report("periodic part", `${part.name} has no periodic phase`);
    if (!(count >= 8)) return report("trace count", `${count} points per turn, under 8`);
    const turn: number = 2 * Math.PI;

    // The parameter's law, the seed's parameter and the seed refined at it.
    let law: ILaw;
    let t0: number;
    let first: IPoint | null;
    if (parameter.kind === "arc") {
      const walked: IWalk | string = walk(part, host, input, count, tolerance);
      if (typeof walked === "string") return report("traced loop", walked);
      law = walked.law;
      t0 = 0;
      first = solve(part, host, law, 0, walked.x, walked.face, tolerance);
    } else {
      const made: ILaw | null = lawOf(parameter);
      if (made === null) return report("parameter", "the angle parameter's normal and reference are parallel or zero");
      law = made;
      t0 = parameter.kind === "phase" ? input.seed.phi : law.angle(part.jet(input.seed.s, input.seed.phi).p);
      first = solve(part, host, law, t0, [input.seed.s, input.seed.phi, input.seed.y, input.seed.theta], input.seed.face ?? 0, tolerance);
    }
    if (first === null)
      return report("one loop per contact", `no meeting near the seed (phi ${input.seed.phi}, s ${input.seed.s}, y ${input.seed.y}, theta ${input.seed.theta})`);

    // Continuation over one turn, each target reached by halving steps.
    const points: IPoint[] = [first];
    let current: IPoint = first;
    for (let i: number = 1; i <= count; i++) {
      const target: number = t0 + (turn * i) / count;
      const next: IPoint | null = advance(part, host, law, current, target, tolerance);
      if (next === null) return report("traced loop", `lost at t ${current.t}, toward ${target}`);
      current = next;
      if (i < count) points.push(next);
    }

    // Closure: the same part and host points after one turn, each phase
    // changed by whole periods.
    const home: IAutoMovieSolidSurface = host.faces[first.face]!;
    const same: boolean = current.face === first.face;
    const winding: number = home.period === undefined || !same ? 0 : Math.round((current.theta - first.theta) / home.period);
    const shift: number = home.period === undefined ? 0 : winding * home.period;
    const partWinding: number = Math.round((current.phi - first.phi) / part.period);
    const partShift: number = partWinding * part.period;
    const a0: IJet = part.jet(first.s, first.phi);
    const b0: IJet = home.jet(first.y, first.theta);
    const closed: number = Math.max(
      Math.abs(current.s - first.s) * norm(a0.u),
      Math.abs(current.phi - partShift - first.phi) * norm(a0.v),
      same ? Math.abs(current.y - first.y) * norm(b0.u) : Infinity,
      Math.abs(current.theta - shift - first.theta) * norm(b0.v),
    );
    if (!(closed <= 10 * tolerance)) return report("one loop per contact", `the trace returns ${closed} mm from its start after one turn`);

    // Every traced point inside both surfaces' own ranges: past a chain's
    // end layer its reading is the end section held, not the surface.
    for (const p of points) {
      const outside: string | null = beyond(part, p.s) ?? beyond(host.faces[p.face]!, p.y);
      if (outside !== null) return report("inside the layers", `at t ${p.t}: ${outside}; build the part far enough to cross its host inside both chains' layers`);
    }

    // Tangential contacts along the loop.
    for (const p of points)
      if (p.angle < grazing)
        diagnostics.push({ producer, level: 6, contract: "transversal contact", detail: `tangent planes ${p.angle} rad apart at t ${p.t}, under ${grazing}` });

    const at = (t: number): IPoint | null => {
      // The nearest traced point by parameter, the loop's own copy of the
      // start closing the turn.
      const turns: number = Math.floor((t - t0) / turn);
      const local: number = t - turns * turn;
      const k: number = Math.round(((local - t0) / turn) * count);
      const from: IPoint = k >= count ? shifted(points[0]!, shift, partShift, turn) : points[k]!;
      const p: IPoint | null = advance(part, host, law, from, local, tolerance);
      return p === null ? null : shifted(p, turns * shift, turns * partShift, turns * turn);
    };
    return { curve: { part: part.name, host: host.name, parameter, points, winding, partWinding, at }, diagnostics };
  }

  /**
   * Where a surface's `u` lies past its declared domain, if it does.
   *
   * @param surface The surface.
   * @param u Its first chart parameter.
   * @returns A description with the numbers, or null inside the domain or without one.
   */
  export function beyond(surface: IAutoMovieSolidSurface, u: number): string | null {
    const d: [number, number] | undefined = surface.domain;
    if (d === undefined || (u >= d[0] && u <= d[1])) return null;
    return `${surface.name}'s u ${u} lies outside its layers ${d[0]} to ${d[1]}`;
  }

  /** A parameter's equation with its derivatives. */
  interface ILaw {
    /** `g(P, phi, t)`. */
    g(p: Vec3, phi: number, t: number): number;

    /** `[dg/dP, dg/dphi]`: the gradient in the point and the direct phase term. */
    grad(t: number): [Vec3, number];

    /** `dg/dt`. */
    gt(p: Vec3, t: number): number;

    /** `Q_g` without the part's second-order term: `2 P' . m' + (P - c) . m''`; its `Q_A . m` is added by the caller with `grad`. */
    extra(p: Vec3, dp: Vec3, t: number): number;

    /** The parameter of a point. */
    angle(p: Vec3): number;
  }

  /** A walked loop: its arclength law and the start the trace begins at. */
  interface IWalk {
    /** The law of `t`, the loop's arclength over its length times a turn. */
    law: ILaw;

    /** `[s, phi, y, theta]` at `t = 0`. */
    x: Vec4;

    /** The host face at `t = 0`. */
    face: number;
  }

  /** Steps one walk may take per traced point before it is lost. */
  export const WALK_STEPS: number = 64;

  /** Resampled points of the arclength spline per traced point. */
  export const WALK_POINTS: number = 4;

  /**
   * Walk the loop from the seed by pseudo-arclength continuation, once to
   * measure it and once in equal chords, and make the law of its arclength.
   *
   * Each step predicts `P + h T` along the curve's unit tangent
   * `T = n_A x n_B` (turned with the previous) and corrects on the plane
   * square to `T` through the prediction; the first walk halves a step that
   * fails or lands more than a quarter step off, and ends where the start
   * lies ahead within a step; the second takes `WALK_POINTS * count` equal
   * steps of that length. The first step's length is the arc a part ring
   * step covers there, `|A_phi| 2 pi / count`.
   *
   * @returns The walk, or why it failed.
   */
  function walk(part: IAutoMovieSolidSurface, host: IAutoMovieSolidAtlas, input: IInput, count: number, tolerance: number): IWalk | string {
    const tangent = (p: IPoint, along: Vec3 | null): Vec3 | null => {
      const a: IJet = part.jet(p.s, p.phi);
      const b: IJet = host.faces[p.face]!.jet(p.y, p.theta);
      const t: Vec3 | null = AutoMovieSolidVector.unit(cross(cross(a.u, a.v), cross(b.u, b.v)));
      if (t === null) return null;
      return along !== null && dot(t, along) < 0 ? scale(t, -1) : t;
    };
    const across = (c: Vec3, m: Vec3): ILaw => ({
      g: (p: Vec3): number => dot(sub(p, c), m),
      grad: (): [Vec3, number] => [m, 0],
      gt: (): number => 0,
      extra: (): number => 0,
      angle: (): number => 0,
    });

    // The seed refined on the plane through it square to the curve.
    const face0: number = input.seed.face ?? 0;
    const x0: Vec4 = [input.seed.s, input.seed.phi, input.seed.y, input.seed.theta];
    const a0: IJet = part.jet(x0[0], x0[1]);
    const b0: IJet = host.faces[face0]!.jet(x0[2], x0[3]);
    const t0: Vec3 | null = AutoMovieSolidVector.unit(cross(cross(a0.u, a0.v), cross(b0.u, b0.v)));
    if (t0 === null) return "the surfaces touch at the seed";
    const start: IPoint | null = solve(part, host, across(a0.p, t0), 0, x0, face0, tolerance);
    if (start === null) return "no meeting near the seed";
    const T0: Vec3 = tangent(start, t0) ?? t0;

    // One step of length h from a point along its tangent.
    const step = (p: IPoint, T: Vec3, h: number, previous: IPoint | null): IPoint | null => {
      const predicted: Vec3 = add(p.point, scale(T, h));
      const x: Vec4 = [p.s, p.phi, p.y, p.theta];
      const guess: Vec4 =
        previous === null || previous.face !== p.face
          ? x
          : [2 * x[0] - previous.s, 2 * x[1] - previous.phi, 2 * x[2] - previous.y, 2 * x[3] - previous.theta];
      const next: IPoint | null = solve(part, host, across(predicted, T), 0, guess, p.face, tolerance);
      return next !== null && norm(sub(next.point, predicted)) <= 0.25 * h + 10 * tolerance ? next : null;
    };

    // The first walk: the loop's length.
    let h: number = (norm(a0.v) * 2 * Math.PI) / count;
    let p: IPoint = start;
    let T: Vec3 = T0;
    let previous: IPoint | null = null;
    let length: number = 0;
    let closed: boolean = false;
    for (let k: number = 0; k < WALK_STEPS * count; k++) {
      const ahead: Vec3 = sub(start.point, p.point);
      if (k > 2 && norm(ahead) <= h && dot(ahead, T) > 0) {
        length += norm(ahead);
        closed = true;
        break;
      }
      let next: IPoint | null = null;
      for (let halving: number = 0; halving < HALVINGS && next === null; halving++) {
        next = step(p, T, h, previous);
        if (next === null) h /= 2;
      }
      if (next === null) return `lost after ${length} mm of the walk`;
      length += norm(sub(next.point, p.point));
      previous = p;
      p = next;
      const t: Vec3 | null = tangent(p, T);
      if (t === null) return `the surfaces touch ${length} mm along the walk`;
      T = t;
    }
    if (!closed) return `the walk does not return to its start in ${WALK_STEPS * count} steps`;

    // The second walk: equal chords of the length, the points of the spline.
    const n: number = WALK_POINTS * count;
    const chord: number = length / n;
    const points: Vec3[] = [start.point];
    p = start;
    T = T0;
    previous = null;
    for (let k: number = 1; k < n; k++) {
      const next: IPoint | null = step(p, T, chord, previous);
      if (next === null) return `the equal-chord walk is lost at step ${k} of ${n}`;
      points.push(next.point);
      previous = p;
      p = next;
      const t: Vec3 | null = tangent(p, T);
      if (t === null) return `the surfaces touch at step ${k} of the equal-chord walk`;
      T = t;
    }
    return { law: arcLaw(points), x: [start.s, start.phi, start.y, start.theta], face: start.face };
  }

  /**
   * The law of a loop's arclength through its equal-chord points: the
   * periodic cubic B-spline `Q` through them (`AutoMovieSplineCurve`'s
   * interpolation, component by component), and `g = (P - Q(t)) . Q'(t)`,
   * whose zero is the point's foot on `Q`. With `P' = A_s s' + A_phi phi'`:
   * `g_t = -Q' . Q' + (P - Q) . Q''` and, past the terms of `J x''` and
   * `Q_A . Q'`, `d^2 g / dt^2` keeps `2 P' . Q'' - 3 Q' . Q'' + (P - Q) . Q'''`.
   */
  function arcLaw(points: readonly Vec3[]): ILaw {
    const n: number = points.length;
    const xy: number[] = AutoMovieSplineCurve.interpolate(points.map((p: Vec3): [number, number] => [p[0], p[1]]));
    const z: number[] = AutoMovieSplineCurve.interpolate(points.map((p: Vec3): [number, number] => [p[2], 0]));
    const control: Vec3[] = Array.from({ length: n }, (_: unknown, k: number): Vec3 => [xy[k]!, xy[n + k]!, z[k]!]);
    const at = (t: number): [Vec3, Vec3, Vec3, Vec3] => {
      const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      const f: number = u - i;
      const g: number = 1 - f;
      const k: number = n / (2 * Math.PI);
      const w: number[][] = [
        [(g * g * g) / 6, (3 * f * f * f - 6 * f * f + 4) / 6, (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6, (f * f * f) / 6],
        [(-g * g) / 2, (3 * f * f - 4 * f) / 2, (-3 * f * f + 2 * f + 1) / 2, (f * f) / 2],
        [g, 3 * f - 2, 1 - 3 * f, f],
        [-1, 3, -3, 1],
      ];
      const out: [Vec3, Vec3, Vec3, Vec3] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let d: number = 0; d < 4; d++)
        for (let j: number = 0; j < 4; j++) {
          const c: Vec3 = control[(((i - 1 + j) % n) + n) % n]!;
          const s: number = w[d]![j]! * k ** d;
          out[d]![0] += s * c[0];
          out[d]![1] += s * c[1];
          out[d]![2] += s * c[2];
        }
      return out;
    };
    return {
      g: (p: Vec3, _phi: number, t: number): number => {
        const [q, q1] = at(t);
        return dot(sub(p, q), q1);
      },
      grad: (t: number): [Vec3, number] => [at(t)[1], 0],
      gt: (p: Vec3, t: number): number => {
        const [q, q1, q2] = at(t);
        return -dot(q1, q1) + dot(sub(p, q), q2);
      },
      extra: (p: Vec3, dp: Vec3, t: number): number => {
        const [q, q1, q2, q3] = at(t);
        return 2 * dot(dp, q2) - 3 * dot(q1, q2) + dot(sub(p, q), q3);
      },
      angle: (): number => 0,
    };
  }

  /** The law of a parameter, or null for a degenerate axis. */
  function lawOf(parameter: Parameter): ILaw | null {
    if (parameter.kind === "arc") return null;
    if (parameter.kind === "phase")
      return {
        g: (_p: Vec3, phi: number, t: number): number => phi - t,
        grad: (): [Vec3, number] => [[0, 0, 0], 1],
        gt: (): number => -1,
        extra: (): number => 0,
        angle: (): number => 0,
      };
    const n: Vec3 | null = AutoMovieSolidVector.unit(parameter.normal);
    if (n === null) return null;
    const e1: Vec3 | null = AutoMovieSolidVector.unit(sub(parameter.reference, scale(n, dot(parameter.reference, n))));
    if (e1 === null) return null;
    const e2: Vec3 = cross(n, e1);
    const c: Vec3 = parameter.centre;
    const d = (t: number): Vec3 => add(scale(e1, Math.cos(t)), scale(e2, Math.sin(t)));
    const m = (t: number): Vec3 => add(scale(e1, -Math.sin(t)), scale(e2, Math.cos(t)));
    return {
      g: (p: Vec3, _phi: number, t: number): number => dot(sub(p, c), m(t)),
      grad: (t: number): [Vec3, number] => [m(t), 0],
      gt: (p: Vec3, t: number): number => -dot(sub(p, c), d(t)),
      extra: (p: Vec3, dp: Vec3, t: number): number => -2 * dot(dp, d(t)) - dot(sub(p, c), m(t)),
      angle: (p: Vec3): number => Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)),
    };
  }

  /**
   * A host as an atlas: itself, or a single surface as the atlas of one face
   * whose region is all of its chart.
   *
   * @param host The host.
   * @returns The atlas.
   */
  export function atlas(host: IAutoMovieSolidSurface | IAutoMovieSolidAtlas): IAutoMovieSolidAtlas {
    if ("faces" in host) return host;
    return { name: host.name, faces: [host], kept: (): boolean => true, across: (): null => null };
  }

  /** Face changes one solve may make before it is lost. */
  export const SWITCHES: number = 4;

  /**
   * One meeting point at a parameter on an atlas: Newton on one face, and
   * where the host point leaves that face's kept region, again on the
   * neighbour from the mapped point.
   *
   * @returns The point with its face, or null when a solve fails or the point
   *   leaves through an open end.
   */
  function solve(part: IAutoMovieSolidSurface, host: IAutoMovieSolidAtlas, law: ILaw, t: number, guess: Readonly<Vec4>, face: number, tolerance: number): IPoint | null {
    let f: number = face;
    let x: Vec4 = [guess[0], guess[1], guess[2], guess[3]];
    for (let k: number = 0; k <= SWITCHES; k++) {
      const p: IPoint | null = solveOn(part, host.faces[f]!, law, t, x, tolerance);
      if (p === null) return null;
      if (host.kept(f, p.y, p.theta)) return { ...p, face: f };
      const next: { face: number; u: number; v: number } | null = host.across(f, p.y, p.theta);
      if (next === null) return null;
      f = next.face;
      x = [p.s, p.phi, next.u, next.v];
    }
    return null;
  }

  /**
   * One meeting point at a parameter, by Newton from a guess, with its jets.
   *
   * @param part The attached part.
   * @param host The host.
   * @param law The parameter's equation.
   * @param t The parameter.
   * @param guess `[s, phi, y, theta]` to start from.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point, or null when Newton does not reach the tolerance
   *   within {@link STEPS} or `J` is singular at the solution.
   */
  function solveOn(part: IAutoMovieSolidSurface, host: IAutoMovieSolidSurface, law: ILaw, t: number, guess: Readonly<Vec4>, tolerance: number): IPoint | null {
    let x: Vec4 = [guess[0], guess[1], guess[2], guess[3]];
    let a: IJet = part.jet(x[0], x[1]);
    let b: IJet = host.jet(x[2], x[3]);
    const residual = (aj: IJet, bj: IJet, xs: Vec4): number[] => [...sub(aj.p, bj.p), law.g(aj.p, xs[1], t)];
    const size = (r: number[]): number => Math.hypot(...r);
    let r: number[] = residual(a, b, x);
    let gap: number = size(r);

    for (let step: number = 0; step < STEPS && !(gap <= tolerance); step++) {
      const dx: number[] | null = AutoMovieSolidVector.solve(jacobian(a, b, law, t), r.map((v: number): number => -v));
      if (dx === null) return null;

      // A backtracking line search keeps every step a descent of the residual.
      let k: number = 1;
      let moved: boolean = false;
      for (let halving: number = 0; halving < 20; halving++, k /= 2) {
        const y: Vec4 = [x[0] + k * dx[0]!, x[1] + k * dx[1]!, x[2] + k * dx[2]!, x[3] + k * dx[3]!];
        const ay: IJet = part.jet(y[0], y[1]);
        const by: IJet = host.jet(y[2], y[3]);
        const ry: number[] = residual(ay, by, y);
        if (size(ry) < gap) {
          x = y;
          a = ay;
          b = by;
          r = ry;
          gap = size(ry);
          moved = true;
          break;
        }
      }
      if (!moved) return null;
    }
    if (!(gap <= tolerance)) return null;

    // One more Newton step past the tolerance, kept only if it does not
    // widen the residual: near the root it takes the residual to rounding, so
    // the curve read at neighbouring parameters carries no solver noise for
    // the blend's derivatives to amplify.
    const polish: number[] | null = AutoMovieSolidVector.solve(jacobian(a, b, law, t), r.map((v: number): number => -v));
    if (polish !== null) {
      const y: Vec4 = [x[0] + polish[0]!, x[1] + polish[1]!, x[2] + polish[2]!, x[3] + polish[3]!];
      const ay: IJet = part.jet(y[0], y[1]);
      const by: IJet = host.jet(y[2], y[3]);
      if (size(residual(ay, by, y)) <= gap) {
        x = y;
        a = ay;
        b = by;
      }
    }
    return point(a, b, law, t, x, 0);
  }

  /** The 4 by 4 Jacobian by rows: the meeting's three, then the parameter's. */
  function jacobian(a: IJet, b: IJet, law: ILaw, t: number): number[][] {
    const [gp, gphi]: [Vec3, number] = law.grad(t);
    return [
      ...[0, 1, 2].map((i: number): number[] => [a.u[i]!, a.v[i]!, -b.u[i]!, -b.v[i]!]),
      [dot(gp, a.u), dot(gp, a.v) + gphi, 0, 0],
    ];
  }

  /**
   * The point's jets from the two surfaces' jets at a solution.
   *
   * @returns The point, or null when `J` is singular.
   */
  function point(a: IJet, b: IJet, law: ILaw, t: number, x: Readonly<Vec4>, face: number): IPoint | null {
    const J: number[][] = jacobian(a, b, law, t);
    const rate: number[] | null = AutoMovieSolidVector.solve(J, [0, 0, 0, -law.gt(a.p, t)]);
    if (rate === null) return null;
    const [ds, dp, dy, dt] = rate as Vec4;
    const qa: Vec3 = combine([
      [ds * ds, a.uu],
      [2 * ds * dp, a.uv],
      [dp * dp, a.vv],
    ]);
    const qb: Vec3 = combine([
      [dy * dy, b.uu],
      [2 * dy * dt, b.uv],
      [dt * dt, b.vv],
    ]);
    const tangent: Vec3 = combine([
      [ds, a.u],
      [dp, a.v],
    ]);
    const qg: number = dot(law.grad(t)[0], qa) + law.extra(a.p, tangent, t);
    const q: Vec3 = sub(qa, qb);
    const rate2: number[] | null = AutoMovieSolidVector.solve(J, [-q[0], -q[1], -q[2], -qg]);
    if (rate2 === null) return null;

    // The angle between the tangent planes from the normals' cross product.
    const na: Vec3 = cross(a.u, a.v);
    const nb: Vec3 = cross(b.u, b.v);
    const sine: number = norm(cross(na, nb)) / (norm(na) * norm(nb));

    return {
      t,
      face,
      s: x[0],
      phi: x[1],
      y: x[2],
      theta: x[3],
      point: a.p,
      tangent,
      second: combine([
        [1, qa],
        [rate2[0]!, a.u],
        [rate2[1]!, a.v],
      ]),
      rate: rate as Vec4,
      rate2: rate2 as Vec4,
      angle: Math.asin(Math.min(1, sine)),
    };
  }

  /**
   * Continue from a point to a target parameter by predicted and corrected
   * steps, halving a step that fails or jumps.
   *
   * @returns The point at the target, or null when a step is halved
   *   {@link HALVINGS} times without landing.
   */
  function advance(part: IAutoMovieSolidSurface, host: IAutoMovieSolidAtlas, law: ILaw, from: IPoint, target: number, tolerance: number): IPoint | null {
    let current: IPoint = from;
    let h: number = target - from.t;
    let halvings: number = 0;

    while (current.t !== target) {
      const step: number = Math.abs(target - current.t) < Math.abs(h) ? target - current.t : h;
      const x0: Vec4 = [current.s, current.phi, current.y, current.theta];
      const guess: Vec4 = x0.map((v: number, i: number): number => v + current.rate[i]! * step + (current.rate2[i]! * step * step) / 2) as Vec4;
      const predicted: Vec3 = combine([
        [1, current.point],
        [step, current.tangent],
        [(step * step) / 2, current.second],
      ]);
      const t: number = Math.abs(target - current.t - step) === 0 ? target : current.t + step;
      const next: IPoint | null = solve(part, host, law, t, guess, current.face, tolerance);
      const length: number = norm(sub(predicted, current.point));
      if (next !== null && norm(sub(next.point, predicted)) <= 0.25 * length + 10 * tolerance) {
        current = next;
        continue;
      }
      if (++halvings > HALVINGS) return null;
      h = step / 2;
    }
    return current;
  }

  /** A point moved by whole turns: its host phase, part phase and parameter shifted. */
  function shifted(p: IPoint, theta: number, phi: number, t: number): IPoint {
    return theta === 0 && phi === 0 && t === 0 ? p : { ...p, theta: p.theta + theta, phi: p.phi + phi, t: p.t + t };
  }
}
