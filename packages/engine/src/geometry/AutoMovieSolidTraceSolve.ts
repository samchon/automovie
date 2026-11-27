import type {
  AutoMovieSolidChartVector4,
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceLaw,
  IAutoMovieSolidTraceTrialTrial,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidTraceObservation as Observation } from "./construction/AutoMovieSolidTraceObservation";
import { AutoMovieSolidTraceTrial } from "./construction/internal/AutoMovieSolidTraceTrial";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

type Vec3 = AutoMovieVector3Tuple;
type IJet = IAutoMovieSolidSurface.IJet;
const { combine, cross, dot, norm, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * The meeting points of an intersection trace (`AutoMovieSolidIntersection`):
 * Newton's method on the four equations `A(s, phi) = B(y, theta)` and the
 * parameter law, on one host face or across an atlas's faces where the host
 * point leaves one, each point's first and second rates in `t` by the implicit
 * function theorem, and the continuation step from one point to the next with
 * its halving.
 */
export namespace AutoMovieSolidTraceSolve {
  /** Newton steps per solve. */
  export const STEPS: number = 40;

  /** Halvings of one continuation step before the trace is lost. */
  export const HALVINGS: number = 24;

  /** Face changes one solve may make before it is lost. */
  export const SWITCHES: number = 4;

  /**
   * One meeting point at a parameter on an atlas: Newton on one face, and where
   * the host point leaves that face's kept region, again on the neighbour from
   * the mapped point.
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
   */
  export function solve(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    law: IAutoMovieSolidTraceLaw.ILaw,
    t: number,
    guess: Readonly<AutoMovieSolidChartVector4>,
    face: number,
    tolerance: number,
    observation?: Observation.IState,
  ): IAutoMovieSolidIntersection.IPoint | null {
    let f: number = face;
    let x: AutoMovieSolidChartVector4 = [
      guess[0],
      guess[1],
      guess[2],
      guess[3],
    ];
    const budget: { left: number } = { left: SWITCHES };
    for (let k: number = 0; k <= SWITCHES; k++) {
      const p: IAutoMovieSolidIntersection.IPoint | null = solveOn(
        part,
        host,
        law,
        t,
        x,
        tolerance,
        f,
        budget,
        observation,
      );
      if (p === null) return null;
      f = p.face;
      if (host.kept(f, p.y, p.theta)) return p;
      if (budget.left === 0)
        return Observation.fail(
          observation,
          "host-crossing-budget",
          [p.s, p.phi, p.y, p.theta],
          f,
          { budget: budget.left },
        );
      const next: { face: number; u: number; v: number } | null = host.across(
        f,
        p.y,
        p.theta,
      );
      if (next === null)
        return Observation.fail(
          observation,
          "host-open-boundary",
          [p.s, p.phi, p.y, p.theta],
          f,
          { budget: budget.left },
        );
      budget.left--;
      f = next.face;
      x = [p.s, p.phi, next.u, next.v];
    }
    return Observation.fail(observation, "host-face-limit", x, f, {
      budget: budget.left,
    });
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
   * @returns The point, or null when Newton does not reach the tolerance within
   *   {@link STEPS} or `J` is singular at the solution.
   */
  function solveOn(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    law: IAutoMovieSolidTraceLaw.ILaw,
    t: number,
    guess: Readonly<AutoMovieSolidChartVector4>,
    tolerance: number,
    face: number,
    budget: { left: number },
    observation?: Observation.IState,
  ): IAutoMovieSolidIntersection.IPoint | null {
    if (observation !== undefined) {
      observation.meeting = null;
      observation.trial = null;
      observation.failure = null;
    }
    let x: AutoMovieSolidChartVector4 = [
      guess[0],
      guess[1],
      guess[2],
      guess[3],
    ];
    const initialA: IJet | null = AutoMovieSolidDomain.jet(part, x[0], x[1]);
    if (initialA === null)
      return Observation.fail(observation, "part-jet-unavailable", x, face, {
        budget: budget.left,
      });
    const initialB: IAutoMovieSolidTraceTrialTrial | null =
      AutoMovieSolidTraceTrial(
        host,
        face,
        x[2],
        x[3],
        budget.left > 0,
        observation,
      );
    if (initialB === null)
      return Observation.fail(observation, "host-trial-unavailable", x, face, {
        part: initialA,
        budget: budget.left,
      });
    if (initialB.crossed) budget.left--;
    let currentFace: number = initialB.face;
    x = [x[0], x[1], initialB.u, initialB.v];
    let a: IJet = initialA;
    let b: IJet = initialB.jet;
    const residual: (
      aj: IJet,
      bj: IJet,
      xs: AutoMovieSolidChartVector4,
    ) => number[] = (
      aj: IJet,
      bj: IJet,
      xs: AutoMovieSolidChartVector4,
    ): number[] => [...sub(aj.p, bj.p), law.g(aj.p, xs[1], t)];
    const size: (r: number[]) => number = (r: number[]): number =>
      Math.hypot(...r);
    let r: number[] = residual(a, b, x);
    let gap: number = size(r);
    Observation.hold(observation, gap, r, a, b, budget.left);

    for (let step: number = 0; step < STEPS && !(gap <= tolerance); step++) {
      const J: number[][] = jacobian(a, b, law, t);
      if (observation?.meeting !== undefined && observation.meeting !== null)
        observation.meeting.jacobian = J;
      const dx: number[] | null = AutoMovieSolidVector.solve(
        J,
        r.map((v: number): number => -v),
      );
      if (dx === null)
        return Observation.fail(
          observation,
          "singular-newton-jacobian",
          x,
          currentFace,
        );

      // A backtracking line search keeps every step a descent of the residual.
      let k: number = 1;
      let moved: boolean = false;
      for (let halving: number = 0; halving < 20; halving++, k /= 2) {
        const y: AutoMovieSolidChartVector4 = [
          x[0] + k * dx[0]!,
          x[1] + k * dx[1]!,
          x[2] + k * dx[2]!,
          x[3] + k * dx[3]!,
        ];
        const ay: IJet | null = AutoMovieSolidDomain.jet(part, y[0], y[1]);
        if (ay === null) {
          Observation.reject(
            observation,
            "part-jet-unavailable",
            y,
            currentFace,
          );
          continue;
        }
        const by: IAutoMovieSolidTraceTrialTrial | null =
          AutoMovieSolidTraceTrial(
            host,
            currentFace,
            y[2],
            y[3],
            budget.left > 0,
            observation,
          );
        if (by === null) continue;
        const mapped: AutoMovieSolidChartVector4 = [y[0], y[1], by.u, by.v];
        const ry: number[] = residual(ay, by.jet, mapped);
        const candidateGap: number = size(ry);
        if (candidateGap < gap) {
          if (by.crossed) budget.left--;
          currentFace = by.face;
          x = mapped;
          a = ay;
          b = by.jet;
          r = ry;
          gap = size(ry);
          Observation.hold(observation, gap, r, a, b, budget.left);
          moved = true;
          break;
        }
        Observation.reject(
          observation,
          "residual-not-decreasing",
          mapped,
          by.face,
        );
      }
      if (!moved)
        return Observation.fail(
          observation,
          "line-search-stalled",
          x,
          currentFace,
        );
    }
    if (!(gap <= tolerance))
      return Observation.fail(observation, "newton-iterations", x, currentFace);

    // One more Newton step past the tolerance, kept only if it does not
    // widen the residual: near the root it takes the residual to rounding, so
    // the curve read at neighbouring parameters carries no solver noise for
    // the blend's derivatives to amplify.
    const polish: number[] | null = AutoMovieSolidVector.solve(
      jacobian(a, b, law, t),
      r.map((v: number): number => -v),
    );
    if (polish !== null) {
      const y: AutoMovieSolidChartVector4 = [
        x[0] + polish[0]!,
        x[1] + polish[1]!,
        x[2] + polish[2]!,
        x[3] + polish[3]!,
      ];
      const ay: IJet | null = AutoMovieSolidDomain.jet(part, y[0], y[1]);
      if (ay !== null) {
        const by: IAutoMovieSolidTraceTrialTrial | null =
          AutoMovieSolidTraceTrial(
            host,
            currentFace,
            y[2],
            y[3],
            budget.left > 0,
            observation,
          );
        if (by !== null) {
          const mapped: AutoMovieSolidChartVector4 = [y[0], y[1], by.u, by.v];
          const polishedResidual: number[] = residual(ay, by.jet, mapped);
          const polishedGap: number = size(polishedResidual);
          if (polishedGap <= gap) {
            if (by.crossed) budget.left--;
            currentFace = by.face;
            x = mapped;
            a = ay;
            b = by.jet;
            Observation.hold(
              observation,
              polishedGap,
              polishedResidual,
              a,
              b,
              budget.left,
            );
          }
        }
      }
    }
    return point(a, b, law, t, x, currentFace, observation);
  }

  /** The 4 by 4 Jacobian by rows: the meeting's three, then the parameter's. */
  function jacobian(
    a: IJet,
    b: IJet,
    law: IAutoMovieSolidTraceLaw.ILaw,
    t: number,
  ): number[][] {
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
    law: IAutoMovieSolidTraceLaw.ILaw,
    t: number,
    x: Readonly<AutoMovieSolidChartVector4>,
    face: number,
    observation?: Observation.IState,
  ): IAutoMovieSolidIntersection.IPoint | null {
    const J: number[][] = jacobian(a, b, law, t);
    if (observation?.meeting !== undefined && observation.meeting !== null)
      observation.meeting.jacobian = J;
    const rate: number[] | null = AutoMovieSolidVector.solve(J, [
      0,
      0,
      0,
      -law.gt(a.p, t),
    ]);
    if (rate === null)
      return Observation.fail(observation, "singular-first-rate", x, face);
    const [ds, dp, dy, dt] = rate as AutoMovieSolidChartVector4;
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
    if (rate2 === null)
      return Observation.fail(observation, "singular-second-rate", x, face);

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
      rate: rate as AutoMovieSolidChartVector4,
      rate2: rate2 as AutoMovieSolidChartVector4,
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
   * @param observation Optional call-owned record of the last meeting attempt's
   *   refusal; it changes no candidate, budget or result.
   * @returns The point at the target, or null after more than {@link HALVINGS}
   *   consecutive failed halvings, 1024 meeting candidates, or a proposed
   *   parameter that cannot make finite representable progress.
   *
   *   The next proposal may double when the corrected world defect uses at most
   *   one eighth of the existing acceptance allowance. That is a bounded
   *   proposal heuristic, not a third-order error guarantee for a C2 surface;
   *   every candidate still passes the same predictor/corrector acceptance
   *   test. The original interval caps growth and each accepted point restarts
   *   the consecutive-failure counter. The 1024-candidate protection is a
   *   product work budget, not a geometric sufficiency condition or a wall-time
   *   bound. Different accepted substeps can change rounding or expose a budget
   *   failure without changing the source surfaces, Newton residual or
   *   tolerance.
   */
  export function advance(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    law: IAutoMovieSolidTraceLaw.ILaw,
    from: IAutoMovieSolidIntersection.IPoint,
    target: number,
    tolerance: number,
    observation?: Observation.IState,
  ): IAutoMovieSolidIntersection.IPoint | null {
    let current: IAutoMovieSolidIntersection.IPoint = from;

    /** Signed original interval, also the maximum recovered proposal. */
    const span: number = target - from.t;
    let h: number = span;
    let halvings: number = 0;

    /**
     * Every accepted or rejected meeting candidate spends the same product work
     * budget.
     */
    for (
      let attempt: number = 0;
      current.t !== target && attempt < 1024;
      attempt++
    ) {
      const step: number =
        Math.abs(target - current.t) < Math.abs(h) ? target - current.t : h;
      const x0: AutoMovieSolidChartVector4 = [
        current.s,
        current.phi,
        current.y,
        current.theta,
      ];
      const guess: AutoMovieSolidChartVector4 = x0.map(
        (v: number, i: number): number =>
          v + current.rate[i]! * step + (current.rate2[i]! * step * step) / 2,
      ) as AutoMovieSolidChartVector4;
      const predicted: Vec3 = combine([
        [1, current.point],
        [step, current.tangent],
        [(step * step) / 2, current.second],
      ]);
      const t: number =
        Math.abs(target - current.t - step) === 0 ? target : current.t + step;
      if (t === current.t) return null;
      const next: IAutoMovieSolidIntersection.IPoint | null = solve(
        part,
        host,
        law,
        t,
        guess,
        current.face,
        tolerance,
        observation,
      );
      const length: number = norm(sub(predicted, current.point));

      /** The unchanged world-space predictor allowance, in mm. */
      const allowance: number = 0.25 * length + 10 * tolerance;

      /**
       * A missing correction is rejected; a present one keeps the original
       * defect norm.
       */
      const defect: number =
        next === null ? Infinity : norm(sub(next.point, predicted));
      if (next !== null && defect <= allowance) {
        current = next;
        halvings = 0;

        // Recovery proposes a larger step; its own corrected result must still pass.
        h =
          defect <= allowance / 8
            ? Math.sign(step) * Math.min(Math.abs(span), 2 * Math.abs(step))
            : step;
        continue;
      }
      // A corrected point refused by the predictor allowance is this attempt's refusal; a failed solve has recorded its own.
      if (next !== null)
        Observation.fail(
          observation,
          "branch-distance",
          [next.s, next.phi, next.y, next.theta],
          next.face,
        );
      if (observation !== undefined)
        observation.step = {
          h: step,
          predicted,
          tangent: current.tangent,
          guess,
          halving: halvings,
          distance: next === null ? null : defect,
          allowance,
        };
      if (++halvings > HALVINGS) return null;
      h = step / 2;
    }
    return current.t === target ? current : null;
  }

  /**
   * A point moved by whole turns: its host phase, part phase and parameter
   * shifted.
   *
   * @param p The point.
   * @param theta The host phase's shift, radians.
   * @param phi The part phase's shift, radians.
   * @param t The parameter's shift, radians.
   * @returns The moved point, or the point itself for no shift.
   */
  export function shifted(
    p: IAutoMovieSolidIntersection.IPoint,
    theta: number,
    phi: number,
    t: number,
  ): IAutoMovieSolidIntersection.IPoint {
    return theta === 0 && phi === 0 && t === 0
      ? p
      : { ...p, theta: p.theta + theta, phi: p.phi + phi, t: p.t + t };
  }
}
