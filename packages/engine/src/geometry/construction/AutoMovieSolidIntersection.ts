import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type Vec4 = [number, number, number, number];
type IJet = IAutoMovieSolidSurface.IJet;
const { add, cross, dot, norm, scale, sub } = AutoMovieSolidVector;

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
 *
 * @evidence contracts/common.md#principled-implementation The curve is traced by continuation in a declared parameter from one seed, each point Newton's solution of the four meeting equations, so the trace follows one loop of the true intersection.
 * @evidence contracts/common.md#clear-and-simple-design One trace entry with its curve and point records; the laws and solves live in their own files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A loop that does not close, a tangential contact or a point outside a surface's domain is reported; nothing is smoothed over.
 * @evidence contracts/common.md#meaningful-documentation States the equations, the parameter kinds, the trace's checks and the curve's readings.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of traced points per turn, each a few Newton steps from its prediction.
 * @evidence contracts/performance.md#reuse-equivalent-work The curve's `at` corrects from the nearest traced point instead of retracing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the traced points and the law for the curve's lifetime.
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
    let law: AutoMovieSolidTraceLaw.ILaw;
    let t0: number;
    let first: IPoint | null;
    if (parameter.kind === "arc") {
      const walked: IWalk | string = walk(part, host, input, count, tolerance);
      if (typeof walked === "string") return report("traced loop", walked);
      law = walked.law;
      t0 = 0;
      first = AutoMovieSolidTraceSolve.solve(part, host, law, 0, walked.x, walked.face, tolerance);
    } else {
      const made: AutoMovieSolidTraceLaw.ILaw | null = AutoMovieSolidTraceLaw.of(parameter);
      if (made === null) return report("parameter", "the angle parameter's normal and reference are parallel or zero");
      law = made;
      t0 = parameter.kind === "phase" ? input.seed.phi : law.angle(part.jet(input.seed.s, input.seed.phi).p);
      first = AutoMovieSolidTraceSolve.solve(part, host, law, t0, [input.seed.s, input.seed.phi, input.seed.y, input.seed.theta], input.seed.face ?? 0, tolerance);
    }
    if (first === null)
      return report("one loop per contact", `no meeting near the seed (phi ${input.seed.phi}, s ${input.seed.s}, y ${input.seed.y}, theta ${input.seed.theta})`);

    // Continuation over one turn, each target reached by halving steps.
    const points: IPoint[] = [first];
    let current: IPoint = first;
    for (let i: number = 1; i <= count; i++) {
      const target: number = t0 + (turn * i) / count;
      const next: IPoint | null = AutoMovieSolidTraceSolve.advance(part, host, law, current, target, tolerance);
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
      const from: IPoint = k >= count ? AutoMovieSolidTraceSolve.shifted(points[0]!, shift, partShift, turn) : points[k]!;
      const p: IPoint | null = AutoMovieSolidTraceSolve.advance(part, host, law, from, local, tolerance);
      return p === null ? null : AutoMovieSolidTraceSolve.shifted(p, turns * shift, turns * partShift, turns * turn);
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

  /** A walked loop: its arclength law and the start the trace begins at. */
  interface IWalk {
    /** The law of `t`, the loop's arclength over its length times a turn. */
    law: AutoMovieSolidTraceLaw.ILaw;

    /** `[s, phi, y, theta]` at `t = 0`. */
    x: Vec4;

    /** The host face at `t = 0`. */
    face: number;
  }

  /** Steps one walk may take per traced point before it is lost. */
  export const WALK_STEPS: number = 64;

  /** Resampled points of the arclength spline per traced point. */
  export const WALK_POINTS: number = 4;

  /** Secant steps that close the equal-chord walk's last chord onto the others. */
  export const CLOSING_STEPS: number = 6;

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
    const across = (c: Vec3, m: Vec3): AutoMovieSolidTraceLaw.ILaw => ({
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
    const start: IPoint | null = AutoMovieSolidTraceSolve.solve(part, host, across(a0.p, t0), 0, x0, face0, tolerance);
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
      const next: IPoint | null = AutoMovieSolidTraceSolve.solve(part, host, across(predicted, T), 0, guess, p.face, tolerance);
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
      for (let halving: number = 0; halving < AutoMovieSolidTraceSolve.HALVINGS && next === null; halving++) {
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

    // The second walk: equal chords whose last, closing the loop, matches the
    // others. The first walk's length sums uneven steps, so `length / n`
    // leaves the closing chord off by their difference; the chord is set by
    // the secant method on that closing mismatch, a few walks at most.
    const n: number = WALK_POINTS * count;
    const equal: (chord: number) => Vec3[] | string = (chord: number): Vec3[] | string => {
      const points: Vec3[] = [start.point];
      let q: IPoint = start;
      let along: Vec3 = T0;
      let before: IPoint | null = null;
      for (let k: number = 1; k < n; k++) {
        const next: IPoint | null = step(q, along, chord, before);
        if (next === null) return `the equal-chord walk is lost at step ${k} of ${n}`;
        points.push(next.point);
        before = q;
        q = next;
        const t: Vec3 | null = tangent(q, along);
        if (t === null) return `the surfaces touch at step ${k} of the equal-chord walk`;
        along = t;
      }
      return points;
    };
    const mismatch: (points: Vec3[], chord: number) => number = (points: Vec3[], chord: number): number => norm(sub(points[0]!, points[points.length - 1]!)) - chord;
    let c0: number = length / n;
    let p0: Vec3[] | string = equal(c0);
    if (typeof p0 === "string") return p0;
    let g0: number = mismatch(p0, c0);
    let c1: number = c0 + g0 / n;
    for (let i: number = 0; i < CLOSING_STEPS && Math.abs(g0) > 1e-9 * c0; i++) {
      const p1: Vec3[] | string = equal(c1);
      if (typeof p1 === "string") break;
      const g1: number = mismatch(p1, c1);
      const c2: number = g1 === g0 ? c1 : c1 - (g1 * (c1 - c0)) / (g1 - g0);
      [c0, p0, g0, c1] = [c1, p1, g1, c2];
    }
    return { law: AutoMovieSolidTraceLaw.arc(p0), x: [start.s, start.phi, start.y, start.theta], face: start.face };
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

}
