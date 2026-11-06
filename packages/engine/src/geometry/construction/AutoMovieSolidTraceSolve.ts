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
const { combine, cross, dot, norm, sub }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * The meeting points of an intersection trace (`AutoMovieSolidIntersection`): Newton's method on the four equations `A(s, phi) = B(y, theta)` and the parameter law, on one host face or across an atlas's faces where the host point leaves one, each point's first and second rates in `t` by the implicit function theorem, and the continuation step from one point to the next with its halving.
 *
 * @evidence contracts/common.md#principled-implementation Each traced point solves the four meeting equations by Newton, its rates come from the implicit function theorem, and continuation halves rejected proposals and may double a low-defect accepted proposal before checking the next one.
 * @evidence contracts/common.md#clear-and-simple-design Solve on an atlas, solve on a face, advance and shift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checked failed solves, consecutive-halving/work exhaustion and unrepresentable parameter progress return null. Raw law and mm position residuals remain combined without dimensional scaling; no failed trace becomes a fabricated curve.
 * @evidence contracts/common.md#meaningful-documentation States the equations, face switches, dyadic proposal policy and separate numerical/work failure boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Each advance permits at most 1024 meeting candidates including accepted and rejected ones. Each candidate has up to five face attempts of at most 40 Newton iterations with 20 backtracking trials, plus polishing/rate solves; surface/law callback cost remains part of that work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both implicit rate systems reuse the same Jacobian values, but the generic solver separately copies and eliminates it for each right-hand side.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds a constant number of local iterates and returns one point; the candidate budget bounds internal attempts, not time spent in caller-supplied callbacks.
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
    const residual: (aj: IJet, bj: IJet, xs: Vec4) => number[] = (aj: IJet, bj: IJet, xs: Vec4): number[] => [
      ...sub(aj.p, bj.p),
      law.g(aj.p, xs[1], t),
    ];
    const size: (r: number[]) => number = (r: number[]): number => Math.hypot(...r);
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
   * steps, halving a rejected proposal and recovering a low-defect step.
   *
   * @param part The part's surface.
   * @param host The host's faces.
   * @param law The parameter's law.
   * @param from The point to continue from.
   * @param target The parameter to reach.
   * @param tolerance Largest gap accepted, mm.
   * @returns The point at the target, or null after more than {@link HALVINGS}
   *   consecutive failed halvings, 1024 meeting candidates, or a proposed
   *   parameter that cannot make finite representable progress.
   *
   * The next proposal may double when the corrected world defect uses at most
   * one eighth of the existing acceptance allowance. That is a bounded
   * proposal heuristic, not a third-order error guarantee for a C2 surface;
   * every candidate still passes the same predictor/corrector acceptance test.
   * The original interval caps growth and each accepted point restarts the
   * consecutive-failure counter. The 1024-candidate protection is a product
   * work budget, not a geometric sufficiency condition or a wall-time bound.
   * Different accepted substeps can change rounding or expose a budget failure
   * without changing the source surfaces, Newton residual or tolerance.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same second-order chart/world prediction, corrected meeting and relative world-defect/tolerance acceptance. A low-defect accepted point permits a checked dyadic proposal recovery; this follows adaptive predictor/corrector continuation without assuming C3 source jets.
   * @evidence contracts/common.md#clear-and-simple-design One current point, signed proposal and consecutive-rejection counter remain local; one candidate counter bounds successful and failed solves together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither the residual nor the branch-distance allowance is relaxed. Nonfinite/nonadvancing parameters, failed halvings and the explicit work budget return null rather than publishing a partial endpoint; callback exceptions still propagate.
   * @evidence contracts/common.md#meaningful-documentation States the recovery heuristic, unchanged tolerance, rounding-policy difference and the distinction between representable progress, convergence and a product work budget.
   * @evidence contracts/performance.md#efficient-algorithms At most 1024 shared atlas solves are attempted, including accepted substeps and rejected proposals. Low-defect recovery avoids retaining an unnecessarily small step through easier regions; each solve still includes all face, Newton, line-search, law and surface-callback costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The current point's first/second chart rates and world jets supply the next predictor. The already measured world defect also selects the next proposal without evaluating another surface or adding a cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only a constant number of local iterates/prediction arrays survive each iteration; success/null/throw releases call-local state. The attempt limit cannot bound an independently blocking callback, and no task handle is acquired.
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

    /** Signed original interval, also the maximum recovered proposal. */
    const span: number = target - from.t;
    let h: number = span;
    let halvings: number = 0;

    /** Every accepted or rejected meeting candidate spends the same product work budget. */
    for (let attempt: number = 0; current.t !== target && attempt < 1024; attempt++) {
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
      if (!Number.isFinite(t) || t === current.t) return null;
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

      /** The unchanged world-space predictor allowance, in mm. */
      const allowance: number = 0.25 * length + 10 * tolerance;

      /** A missing correction is rejected; a present one keeps the original defect norm. */
      const defect: number = next === null ? Infinity : norm(sub(next.point, predicted));
      if (next !== null && defect <= allowance) {
        current = next;
        halvings = 0;

        // Recovery proposes a larger step; its own corrected result must still pass.
        h = defect <= allowance / 8
          ? Math.sign(step) * Math.min(Math.abs(span), 2 * Math.abs(step))
          : step;
        continue;
      }
      if (++halvings > HALVINGS) return null;
      h = step / 2;
    }
    return current.t === target ? current : null;
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
