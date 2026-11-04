import type { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidVector } from "./AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
type IJet = IAutoMovieHumanSolidSurface.IJet;
const { add, combine, cross, norm, scale, solve3, sub } = AutoMovieHumanSolidVector;

/**
 * The curve where an attached part's surface meets its host's: the
 * surface-surface intersection of the solid merge and diff, traced in the
 * part's phase.
 *
 * The part `A(s, phi)` is a tube with periodic phase `phi` (a limb, a digit, a
 * cutter); the host `B(y, theta)` is any surface. At each part phase the
 * meeting point solves the three equations in three unknowns
 *
 * ```text
 * F(s, y, theta) = A(s, phi) - B(y, theta) = 0
 * ```
 *
 * by Newton's method with the Jacobian `J = [A_s, -B_y, -B_theta]`, so the
 * curve is a function of `phi` and both preimages come with it (Patrikalakis,
 * Maekawa and Cho, Shape Interrogation for CAD and Manufacturing, ch. 5).
 * Differentiating `F(x(phi), phi) = 0` gives the curve's exact jet by the
 * implicit function theorem, with no difference of traced points:
 *
 * ```text
 * x'  = -J^-1 A_phi
 * x'' = -J^-1 (A_phiphi + 2 s' A_sphi + s'^2 A_ss - y'^2 B_yy - 2 y' theta' B_ytheta - theta'^2 B_thetatheta)
 * C'  = A_s s' + A_phi
 * C'' = A_ss s'^2 + 2 A_sphi s' + A_phiphi + A_s s''
 * ```
 *
 * The second line holds because `J x''` collects every second-order term of
 * the chain rule except the one linear in `x''`.
 *
 * Tracing is continuation in `phi` from a seed (a landmark's feet on both
 * surfaces, refined here by Newton): each step predicts by the second-order
 * Taylor step of that jet and corrects by Newton, and a step whose correction
 * fails, or lands farther from its prediction than a quarter of the step's own
 * length (a jump to another branch), is halved. After one turn of `phi` the
 * curve must return to its start, with the host's phase changed by a whole
 * number of its periods; otherwise it is not one closed loop.
 *
 * Premises: the part's station line at each phase crosses the host once near
 * the curve (the curve is a graph over `phi`), and the two surfaces cross
 * transversally. `J` is singular exactly where `A_s` lies in the host's
 * tangent plane: at a tangential contact (normals parallel) or where the curve
 * turns along the part's stations. Both are reported, never stepped over.
 */
export namespace AutoMovieHumanSolidIntersection {
  /** One point of the curve with both preimages and their phase jets. */
  export interface IPoint {
    /** The part's phase, radians. */
    phi: number;

    /** The part's station, its `u`. */
    s: number;

    /** The host's `u`. */
    y: number;

    /** The host's `v`, unwrapped along the traced curve. */
    theta: number;

    /** The curve's point, mm. */
    point: Vec3;

    /** `dC / dphi`, mm per radian. */
    tangent: Vec3;

    /** `d^2 C / dphi^2`. */
    second: Vec3;

    /** `[s', y', theta']` per radian of `phi`. */
    rate: Vec3;

    /** `[s'', y'', theta'']`. */
    rate2: Vec3;

    /** Angle between the two surfaces' tangent planes, radians in `[0, pi / 2]`: zero at a tangential contact. */
    angle: number;
  }

  /** A traced closed loop. */
  export interface ICurve {
    /** The part's surface name. */
    part: string;

    /** The host's surface name. */
    host: string;

    /** The traced points at uniform phases from the seed, one turn, the start not repeated. */
    points: IPoint[];

    /** Whole turns the host's `v` makes over one turn of `phi`; 0 for a loop that encloses a region of the host's chart. */
    winding: number;

    /**
     * The curve at any part phase, corrected by Newton from the nearest
     * traced point.
     *
     * @param phi The part's phase, radians, any real value.
     * @returns The point, its `theta` on the branch of the traced point it
     *   starts from, or null where Newton fails there.
     */
    at(phi: number): IPoint | null;
  }

  /** What a trace needs. */
  export interface IInput {
    /** The attached part, `v` periodic. */
    part: IAutoMovieHumanSolidSurface;

    /** The host. */
    host: IAutoMovieHumanSolidSurface;

    /** The seed: the part's phase and `[s, y, theta]` near the curve there. */
    seed: { phi: number; s: number; y: number; theta: number };

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
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
  }

  /** Newton steps per solve. */
  export const STEPS: number = 40;

  /** Halvings of one continuation step before the trace is lost. */
  export const HALVINGS: number = 24;

  /**
   * Trace the closed curve from its seed.
   *
   * @param input The two surfaces, the seed and the trace's limits.
   * @returns The curve and its diagnostics.
   */
  export function trace(input: IInput): IResult {
    const { part, host, count, tolerance, grazing }: IInput = input;
    const producer: string = `solid.intersection.${part.name}.${host.name}`;
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [];
    const report = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 6, contract, detail });
      return { curve: null, diagnostics };
    };
    if (part.period === undefined) return report("periodic part", `${part.name} has no periodic phase`);
    if (!(count >= 8)) return report("trace count", `${count} points per turn, under 8`);
    const period: number = part.period;

    // The seed, refined.
    const first: IPoint | null = solve(part, host, input.seed.phi, [input.seed.s, input.seed.y, input.seed.theta], tolerance);
    if (first === null)
      return report("one loop per contact", `no meeting near the seed (phi ${input.seed.phi}, s ${input.seed.s}, y ${input.seed.y}, theta ${input.seed.theta})`);

    // Continuation over one turn, each target phase reached by halving steps.
    const points: IPoint[] = [first];
    let current: IPoint = first;
    for (let i: number = 1; i <= count; i++) {
      const target: number = input.seed.phi + (period * i) / count;
      const next: IPoint | null = advance(part, host, current, target, tolerance);
      if (next === null) return report("traced loop", `lost at phi ${current.phi}, toward ${target}`);
      current = next;
      if (i < count) points.push(next);
    }

    // Closure: the same part station and host point after one turn, the host
    // phase changed by whole periods.
    const winding: number = host.period === undefined ? 0 : Math.round((current.theta - first.theta) / host.period);
    const shift: number = host.period === undefined ? 0 : winding * host.period;
    const closed: number = Math.max(
      Math.abs(current.s - first.s) * norm(part.jet(first.s, first.phi).u),
      Math.abs(current.y - first.y) * norm(host.jet(first.y, first.theta).u),
      Math.abs(current.theta - shift - first.theta) * norm(host.jet(first.y, first.theta).v),
    );
    if (!(closed <= 10 * tolerance)) return report("one loop per contact", `the trace returns ${closed} mm from its start after one turn`);

    // Tangential contacts along the loop.
    for (const p of points)
      if (p.angle < grazing)
        diagnostics.push({ producer, level: 6, contract: "transversal contact", detail: `tangent planes ${p.angle} rad apart at phi ${p.phi}, under ${grazing}` });

    const at = (phi: number): IPoint | null => {
      // The nearest traced point by phase, the loop's own copy of the start
      // closing the turn.
      const turns: number = Math.floor((phi - input.seed.phi) / period);
      const local: number = phi - turns * period;
      const k: number = Math.round(((local - input.seed.phi) / period) * count);
      const from: IPoint = shifted(points[k % count]!, k >= count ? shift : 0, k >= count ? period : 0);
      const p: IPoint | null = advance(part, host, from, local, tolerance);
      return p === null ? null : shifted(p, turns * shift, turns * period);
    };
    return { curve: { part: part.name, host: host.name, points, winding, at }, diagnostics };
  }

  /**
   * One meeting point at a part phase, by Newton from a guess, with its jets.
   *
   * @param part The attached part.
   * @param host The host.
   * @param phi The part's phase.
   * @param guess `[s, y, theta]` to start from.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point, or null when Newton does not reach the tolerance
   *   within {@link STEPS} or `J` is singular at the solution.
   */
  export function solve(
    part: IAutoMovieHumanSolidSurface,
    host: IAutoMovieHumanSolidSurface,
    phi: number,
    guess: Readonly<Vec3>,
    tolerance: number,
  ): IPoint | null {
    let x: Vec3 = [guess[0], guess[1], guess[2]];
    let a: IJet = part.jet(x[0], phi);
    let b: IJet = host.jet(x[1], x[2]);
    let gap: number = norm(sub(a.p, b.p));

    for (let step: number = 0; step < STEPS && !(gap <= tolerance); step++) {
      const dx: Vec3 | null = solve3(a.u, scale(b.u, -1), scale(b.v, -1), sub(b.p, a.p));
      if (dx === null) return null;

      // A backtracking line search keeps every step a descent of the gap.
      let k: number = 1;
      let moved: boolean = false;
      for (let halving: number = 0; halving < 20; halving++, k /= 2) {
        const y: Vec3 = add(x, scale(dx, k));
        const ay: IJet = part.jet(y[0], phi);
        const by: IJet = host.jet(y[1], y[2]);
        const g: number = norm(sub(ay.p, by.p));
        if (g < gap) {
          x = y;
          a = ay;
          b = by;
          gap = g;
          moved = true;
          break;
        }
      }
      if (!moved) return null;
    }
    if (!(gap <= tolerance)) return null;

    // One more Newton step past the tolerance, kept only if it does not
    // widen the gap: near the root it takes the residual to rounding, so the
    // curve read at neighbouring phases carries no solver noise for the
    // blend's derivatives to amplify.
    const polish: Vec3 | null = solve3(a.u, scale(b.u, -1), scale(b.v, -1), sub(b.p, a.p));
    if (polish !== null) {
      const y: Vec3 = add(x, polish);
      const ay: IJet = part.jet(y[0], phi);
      const by: IJet = host.jet(y[1], y[2]);
      if (norm(sub(ay.p, by.p)) <= gap) {
        x = y;
        a = ay;
        b = by;
      }
    }
    return point(a, b, phi, x);
  }

  /**
   * The point's jets from the two surfaces' jets at a solution.
   *
   * @param a The part's jet.
   * @param b The host's jet.
   * @param phi The part's phase.
   * @param x `[s, y, theta]`.
   * @returns The point, or null when `J` is singular.
   */
  function point(a: IJet, b: IJet, phi: number, x: Readonly<Vec3>): IPoint | null {
    const c1: Vec3 = scale(b.u, -1);
    const c2: Vec3 = scale(b.v, -1);
    const rate: Vec3 | null = solve3(a.u, c1, c2, scale(a.v, -1));
    if (rate === null) return null;
    const [ds, dy, dt]: Vec3 = rate;
    const rhs: Vec3 = combine([
      [1, a.vv],
      [2 * ds, a.uv],
      [ds * ds, a.uu],
      [-dy * dy, b.uu],
      [-2 * dy * dt, b.uv],
      [-dt * dt, b.vv],
    ]);
    const rate2: Vec3 | null = solve3(a.u, c1, c2, scale(rhs, -1));
    if (rate2 === null) return null;

    // The angle between the tangent planes from the normals' cross product.
    const na: Vec3 = cross(a.u, a.v);
    const nb: Vec3 = cross(b.u, b.v);
    const sine: number = norm(cross(na, nb)) / (norm(na) * norm(nb));

    return {
      phi,
      s: x[0],
      y: x[1],
      theta: x[2],
      point: a.p,
      tangent: add(scale(a.u, ds), a.v),
      second: combine([
        [ds * ds, a.uu],
        [2 * ds, a.uv],
        [1, a.vv],
        [rate2[0], a.u],
      ]),
      rate,
      rate2,
      angle: Math.asin(Math.min(1, sine)),
    };
  }

  /**
   * Continue from a point to a target phase by predicted and corrected steps,
   * halving a step that fails or jumps.
   *
   * @param part The attached part.
   * @param host The host.
   * @param from The point to continue from.
   * @param target The phase to reach.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point at the target, or null when a step is halved
   *   {@link HALVINGS} times without landing.
   */
  function advance(
    part: IAutoMovieHumanSolidSurface,
    host: IAutoMovieHumanSolidSurface,
    from: IPoint,
    target: number,
    tolerance: number,
  ): IPoint | null {
    let current: IPoint = from;
    let h: number = target - from.phi;
    let halvings: number = 0;

    while (current.phi !== target) {
      const step: number = Math.abs(target - current.phi) < Math.abs(h) ? target - current.phi : h;
      const guess: Vec3 = add(add([current.s, current.y, current.theta], scale(current.rate, step)), scale(current.rate2, (step * step) / 2));
      const predicted: Vec3 = combine([
        [1, current.point],
        [step, current.tangent],
        [(step * step) / 2, current.second],
      ]);
      const phi: number = Math.abs(target - current.phi - step) === 0 ? target : current.phi + step;
      const next: IPoint | null = solve(part, host, phi, guess, tolerance);
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

  /**
   * A point moved by whole turns: its part phase and host phase shifted.
   *
   * @param p The point.
   * @param theta Shift of the host phase.
   * @param phi Shift of the part phase.
   * @returns The shifted copy.
   */
  function shifted(p: IPoint, theta: number, phi: number): IPoint {
    return theta === 0 && phi === 0 ? p : { ...p, theta: p.theta + theta, phi: p.phi + phi };
  }
}
