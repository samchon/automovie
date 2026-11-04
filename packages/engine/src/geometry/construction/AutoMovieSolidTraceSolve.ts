import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type Vec4 = [number, number, number, number];
type IJet = IAutoMovieSolidSurface.IJet;
type IPoint = AutoMovieSolidIntersection.IPoint;
type ILaw = AutoMovieSolidTraceLaw.ILaw;
const { combine, cross, dot, norm, sub } = AutoMovieSolidVector;

/**
 * The meeting points of an intersection trace (`AutoMovieSolidIntersection`): Newton's method on the four equations `A(s, phi) = B(y, theta)` and the parameter law, on one host face or across an atlas's faces where the host point leaves one, each point's first and second rates in `t` by the implicit function theorem, and the continuation step from one point to the next with its halving.
 *
 * @evidence contracts/common.md#principled-implementation Each traced point solves the four meeting equations by Newton, its rates come from the implicit function theorem, and continuation halves a step that fails or jumps.
 * @evidence contracts/common.md#clear-and-simple-design Solve on an atlas, solve on a face, advance and shift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checked failed solves/halving exhaustion return null, but raw law and mm position residuals are combined without dimensional scaling, and advance has no explicit accepted-step/progress guard.
 * @evidence contracts/common.md#meaningful-documentation States the equations, the face switches and the halving rule.
 * @evidence contracts/performance.md#efficient-algorithms Each face attempt has at most 40 Newton iterations with up to 20 backtracking trials, plus polishing/rate solves; continuation's accepted substep count is separate from its failed-halving bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Both implicit rate systems reuse the same Jacobian values, but the generic solver separately copies and eliminates it for each right-hand side.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one iterate and returns one point.
 */
export namespace AutoMovieSolidTraceSolve {
  /** Newton steps per solve. */
  export const STEPS: number = 40;

  /** Halvings of one continuation step before the trace is lost. */
  export const HALVINGS: number = 24;

  /** Face changes one solve may make before it is lost. */
  export const SWITCHES: number = 4;

  /**
   * One meeting point at a parameter on an atlas: Newton on one face, and
   * where the host point leaves that face's kept region, again on the
   * neighbour from the mapped point.
   *
   * @param part The part's surface.
   * @param host The host's faces.
   * @param law The parameter's law.
   * @param t The parameter.
   * @param guess `[s, phi, y, theta]` to start from.
   * @param face The host face to start on.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point with its face, or null when a solve fails or the point
   *   leaves through an open end.
   *
   * @evidence contracts/common.md#principled-implementation Solves three surface-meeting equations plus the selected law with backtracked Newton, then maps rejected host-chart points through the atlas and derives rates by the implicit function theorem on a nonsingular Jacobian.
   * @evidence contracts/common.md#clear-and-simple-design The atlas loop owns face identity while solveOn owns one-face Newton and point owns the rate equations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepts the norm of position differences plus the raw law residual; those terms have law-dependent units and no dimensional scaling is applied. It checks host kept regions here, with surface domains checked by the outer tracer.
   * @evidence contracts/common.md#meaningful-documentation Gives chart guess order, parameter, starting face, local tolerance/failure semantics and the raw-residual/domain boundaries.
   * @evidence contracts/performance.md#efficient-algorithms At most five face Newton attempts each use up to 40 iterations with 20 trial halvings, plus a polish and two rate solves; atlas/surface/law callback costs are included rather than reduced to one jet per iteration.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses accepted jets/residuals during Newton and one Jacobian's values for the two rate systems, but factorization and arc-law callback readings are repeated.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The atlas/iterate matrices and candidate points are synchronous call state; null releases local references, and a successful fresh point record borrows its accepted surface point vector and owns computed rates/vectors.
   */
  export function solve(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    law: ILaw,
    t: number,
    guess: Readonly<Vec4>,
    face: number,
    tolerance: number,
  ): IPoint | null {
    let f: number = face;
    let x: Vec4 = [guess[0], guess[1], guess[2], guess[3]];
    for (let k: number = 0; k <= SWITCHES; k++) {
      const p: IPoint | null = solveOn(
        part,
        host.faces[f]!,
        law,
        t,
        x,
        tolerance,
      );
      if (p === null) return null;
      if (host.kept(f, p.y, p.theta)) return { ...p, face: f };
      const next: { face: number; u: number; v: number } | null = host.across(
        f,
        p.y,
        p.theta,
      );
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
  function solveOn(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    law: ILaw,
    t: number,
    guess: Readonly<Vec4>,
    tolerance: number,
  ): IPoint | null {
    let x: Vec4 = [guess[0], guess[1], guess[2], guess[3]];
    let a: IJet = part.jet(x[0], x[1]);
    let b: IJet = host.jet(x[2], x[3]);
    const residual = (aj: IJet, bj: IJet, xs: Vec4): number[] => [
      ...sub(aj.p, bj.p),
      law.g(aj.p, xs[1], t),
    ];
    const size = (r: number[]): number => Math.hypot(...r);
    let r: number[] = residual(a, b, x);
    let gap: number = size(r);

    for (let step: number = 0; step < STEPS && !(gap <= tolerance); step++) {
      const dx: number[] | null = AutoMovieSolidVector.solve(
        jacobian(a, b, law, t),
        r.map((v: number): number => -v),
      );
      if (dx === null) return null;

      // A backtracking line search keeps every step a descent of the residual.
      let k: number = 1;
      let moved: boolean = false;
      for (let halving: number = 0; halving < 20; halving++, k /= 2) {
        const y: Vec4 = [
          x[0] + k * dx[0]!,
          x[1] + k * dx[1]!,
          x[2] + k * dx[2]!,
          x[3] + k * dx[3]!,
        ];
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
    const polish: number[] | null = AutoMovieSolidVector.solve(
      jacobian(a, b, law, t),
      r.map((v: number): number => -v),
    );
    if (polish !== null) {
      const y: Vec4 = [
        x[0] + polish[0]!,
        x[1] + polish[1]!,
        x[2] + polish[2]!,
        x[3] + polish[3]!,
      ];
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
      ...[0, 1, 2].map((i: number): number[] => [
        a.u[i]!,
        a.v[i]!,
        -b.u[i]!,
        -b.v[i]!,
      ]),
      [dot(gp, a.u), dot(gp, a.v) + gphi, 0, 0],
    ];
  }

  /**
   * The point's jets from the two surfaces' jets at a solution.
   *
   * @returns The point, or null when `J` is singular.
   */
  function point(
    a: IJet,
    b: IJet,
    law: ILaw,
    t: number,
    x: Readonly<Vec4>,
    face: number,
  ): IPoint | null {
    const J: number[][] = jacobian(a, b, law, t);
    const rate: number[] | null = AutoMovieSolidVector.solve(J, [
      0,
      0,
      0,
      -law.gt(a.p, t),
    ]);
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
    const rate2: number[] | null = AutoMovieSolidVector.solve(J, [
      -q[0],
      -q[1],
      -q[2],
      -qg,
    ]);
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
   * @param part The part's surface.
   * @param host The host's faces.
   * @param law The parameter's law.
   * @param from The point to continue from.
   * @param target The parameter to reach.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point at the target, or null when a step is halved
   *   {@link HALVINGS} times without landing.
   *
   * Accepted substeps do not increase the reduced step again. The failure
   * counter does not cap successful substeps, and a parameter addition that
   * rounds back to the current value has no explicit progress check.
   *
   * @evidence contracts/common.md#principled-implementation Uses second-order chart/world prediction and a corrected meeting, accepting when its world deviation from prediction fits the relative step/tolerance test; a rejected attempt halves the parameter step.
   * @evidence contracts/common.md#clear-and-simple-design One current point, step and cumulative failure counter drive continuation through the shared atlas solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed attempts exhaust HALVINGS, but accepted substeps have no explicit count cap or floating-point progress guard; representable forward parameter progress remains an unresolved termination premise.
   * @evidence contracts/common.md#meaningful-documentation Gives predicted/corrected behavior and explicitly separates failed-halving limits from successful-substep work and progress.
   * @evidence contracts/performance.md#efficient-algorithms Work is proportional to all accepted and rejected full meeting solves, not merely 24 halvings; reduced steps persist after success, so many accepted solves can remain and no universal cost bound is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work The current point's first/second chart rates and world jets supply the next predictor without retracing its preceding segment.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds only a constant number of iterates/prediction arrays locally, but a nonprogressing synchronous loop would keep that call live; no task handle or cancellation mechanism is acquired here.
   */
  export function advance(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    law: ILaw,
    from: IPoint,
    target: number,
    tolerance: number,
  ): IPoint | null {
    let current: IPoint = from;
    let h: number = target - from.t;
    let halvings: number = 0;

    while (current.t !== target) {
      const step: number =
        Math.abs(target - current.t) < Math.abs(h) ? target - current.t : h;
      const x0: Vec4 = [current.s, current.phi, current.y, current.theta];
      const guess: Vec4 = x0.map(
        (v: number, i: number): number =>
          v + current.rate[i]! * step + (current.rate2[i]! * step * step) / 2,
      ) as Vec4;
      const predicted: Vec3 = combine([
        [1, current.point],
        [step, current.tangent],
        [(step * step) / 2, current.second],
      ]);
      const t: number =
        Math.abs(target - current.t - step) === 0 ? target : current.t + step;
      const next: IPoint | null = solve(
        part,
        host,
        law,
        t,
        guess,
        current.face,
        tolerance,
      );
      const length: number = norm(sub(predicted, current.point));
      if (
        next !== null &&
        norm(sub(next.point, predicted)) <= 0.25 * length + 10 * tolerance
      ) {
        current = next;
        continue;
      }
      if (++halvings > HALVINGS) return null;
      h = step / 2;
    }
    return current;
  }

  /**
   * A point moved by whole turns: its host phase, part phase and parameter shifted.
   *
   * @param p The point.
   * @param theta The host phase's shift, radians.
   * @param phi The part phase's shift, radians.
   * @param t The parameter's shift, radians.
   * @returns The moved point, or the point itself for no shift.
   *
   * @evidence contracts/common.md#principled-implementation Adds declared periodic chart/parameter shifts while preserving the represented world point and derivative data; whole-period equivalence is the caller's premise.
   * @evidence contracts/common.md#clear-and-simple-design Zero shift preserves object identity and a nonzero shift makes one shallow record with three changed scalar fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not re-evaluate geometry or prove the supplied shifts are periods of the surfaces/law.
   * @evidence contracts/common.md#meaningful-documentation Names host phase, part phase and trace-parameter offsets and the identity return for no shift.
   * @evidence contracts/performance.md#efficient-algorithms Constant scalar work and at most one fixed-size record allocation avoid another meeting/rate solve.
   * @evidence contracts/performance.md#reuse-equivalent-work All world vectors and rate arrays are shared with the original point under the declared periodic equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned reference/record; a shallow shifted point retains the original vector/rate arrays but no additional cache or handle.
   */
  export function shifted(
    p: IPoint,
    theta: number,
    phi: number,
    t: number,
  ): IPoint {
    return theta === 0 && phi === 0 && t === 0
      ? p
      : { ...p, theta: p.theta + theta, phi: p.phi + phi, t: p.t + t };
  }
}
