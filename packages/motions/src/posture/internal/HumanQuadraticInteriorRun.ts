import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticInteriorSession as Session } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/*
 * One interior-point solve from the iterate the scope's arrays hold, cold or
 * warm (`HumanQuadraticInterior`): Mehrotra's predictor and corrector on the
 * reduced system until the residuals meet `ACCURACY` and hold through one
 * further Newton step, the arrays written in place.
 * Parameter scope: The program's arrays and the caller's session.
 * Returns: The state the solve ends with, and whether it met `ACCURACY`.
 */
export function HumanQuadraticInteriorRun(
  scope: HumanQuadraticInteriorRun.IScope,
): HumanQuadraticInteriorRun.IResult {  const {
    s,
    session,
    n,
    m,
    start,
    cols,
    vals,
    weight,
    ends,
    live,
    soft,
    free,
    bound,
    pairs,
    x,
    t,
    lambda,
    e,
    nu,
    value,
    along,
    primal,
    excess,
    stiff,
    rho,
    dLambda,
    dT,
    dE,
    dNu,
    secondT,
    secondE,
    dual,
    rhs,
    dx,
    work,
  }: HumanQuadraticInteriorRun.IScope = scope;

  /*
   * Each row's product with a vector of the variables.
   */
  const products: (of: Float64Array, into: Float64Array) => void = (
    of: Float64Array,
    into: Float64Array,
  ): void => {
    for (let r: number = 0; r < m; ++r) {
      let sum: number = 0;
      const end: number = start[r + 1]!;
      for (let a: number = start[r]!; a < end; ++a)
        sum += vals[a]! * of[cols[a]!]!;
      into[r] = sum;
    }
  };

  /*
   * The step for a centring `target` of the products, `second` adding the
   * predictor's products: `rho` per end, the reduced system's solve, then each
   * end's own steps. The factor is the iteration's.
   */
  const direction: (
    factor: Workspace.IFactor,
    target: number,
    second: boolean,
  ) => void = (
    factor: Workspace.IFactor,
    target: number,
    second: boolean,
  ): void => {
    for (let i: number = 0; i < n; ++i) rhs[i] = -dual[i]!;
    for (let r: number = 0; r < m; ++r) {
      let push: number = 0;
      for (let side: number = 0; side < 2; ++side) {
        const j: number = 2 * r + side;
        if (live[j] === 0) continue;
        let at: number = -primal[j]!;
        if (free[j] === 0) {
          const rc: number =
            lambda[j]! * t[j]! - target + (second ? secondT[j]! : 0);
          at += rc / lambda[j]!;
        }
        if (soft[j] === 1) {
          const rs: number =
            nu[j]! * e[j]! - target + (second ? secondE[j]! : 0);
          at -= (rs + e[j]! * excess[j]!) / nu[j]!;
        }
        rho[j] = at;
        push += (side === 0 ? 1 : -1) * stiff[j]! * at;
      }
      if (push === 0) continue;
      const end: number = start[r + 1]!;
      for (let a: number = start[r]!; a < end; ++a)
        rhs[cols[a]!] = rhs[cols[a]!]! + vals[a]! * push;
    }
    HumanQuadraticSubstitute(factor, rhs, dx);
    products(dx, along);
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0) continue;
      const moved: number = (j & 1) === 0 ? along[j >> 1]! : -along[j >> 1]!;
      dLambda[j] = stiff[j]! * (moved - rho[j]!);
      if (free[j] === 1) continue;
      const rc: number =
        lambda[j]! * t[j]! - target + (second ? secondT[j]! : 0);
      dT[j] = (-rc - t[j]! * dLambda[j]!) / lambda[j]!;
      if (soft[j] === 1) {
        const rs: number = nu[j]! * e[j]! - target + (second ? secondE[j]! : 0);
        dNu[j] = excess[j]! - dLambda[j]!;
        dE[j] = (-rs - e[j]! * dNu[j]!) / nu[j]!;
      }
    }
  };

  /*
   * The longest step that keeps every slack and multiplier nonnegative;
   * unbounded where none falls.
   */
  const longest: () => number = (): number => {
    let step: number = Infinity;
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0 || free[j] === 1) continue;
      if (dT[j]! < 0) step = Math.min(step, -t[j]! / dT[j]!);
      if (dLambda[j]! < 0) step = Math.min(step, -lambda[j]! / dLambda[j]!);
      if (soft[j] === 0) continue;
      if (dE[j]! < 0) step = Math.min(step, -e[j]! / dE[j]!);
      if (dNu[j]! < 0) step = Math.min(step, -nu[j]! / dNu[j]!);
    }
    return step;
  };


  let fair: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;

  // The last iterate that met `ACCURACY`, with its point: the further
  // Newton steps below only confirm it, so where one of them is spoilt (a
  // reduced system near the solution grows rows rounding makes dependent,
  // and a step through them can raise the residuals again) or the solve
  // ends otherwise short, this iterate is the solve's answer, converged.
  let kept: IHumanQuadraticInteriorRunKept | undefined;
  const ended = (): IRunEndedResult => {
    if (kept === undefined) return { state: fair, converged: false };
    if (session !== undefined) session.point = kept.point;
    return { state: kept.state, converged: true };
  };

  // The last step's size against the iterate's, largest components. The
  // residuals alone do not bound the iterate's error where the curvature is
  // badly conditioned (a second-difference chain's least curvature is its
  // length to the minus fourth: a residual of 1e-8 left a twenty-variable
  // chain 1.6e-6 off its minimiser), so the solve ends only once a Newton
  // step no longer moves the iterate by more than the accuracy, or once the
  // residuals have held through a further Newton step (which, on a
  // quadratic program whose active ends are found, lands on the minimiser
  // to the factor's accuracy; a degenerate end can keep a step from
  // vanishing, and must not keep the solve from ending).
  let moved: number = Infinity;
  let held: number = 0;

  // The residuals are read once more after the last iteration's step, so
  // the iterate returned is the last one, tested as every other is.
  for (let it: number = 0; it <= ITERATIONS; ++it) {
    // The residuals of the unregularised conditions at the iterate.
    products(x, value);
    Workspace.curvature(s, x, dual);
    let curved: number = 0;
    for (let i: number = 0; i < n; ++i) {
      curved = Math.max(curved, Math.abs(dual[i]!));
      dual[i] = dual[i]! + s.q[i]!;
    }
    const pulled: Float64Array = work.transpose;
    pulled.fill(0);
    let gap: number = 0;
    let missed: number = 0;
    let reached: number = 0;
    for (let r: number = 0; r < m; ++r) {
      reached = Math.max(reached, Math.abs(value[r]!));
      let multiplier: number = 0;
      for (let side: number = 0; side < 2; ++side) {
        const j: number = 2 * r + side;
        if (live[j] === 0) continue;
        const c: number = side === 0 ? value[r]! : -value[r]!;
        multiplier += side === 0 ? lambda[j]! : -lambda[j]!;
        if (free[j] === 1) {
          primal[j] = c - bound[j]!;
          missed = Math.max(missed, Math.abs(primal[j]!));
          stiff[j] = 1 / EQUAL;
          continue;
        }
        primal[j] = c - e[j]! + t[j]! - bound[j]!;
        missed = Math.max(missed, Math.abs(primal[j]!));
        gap += lambda[j]! * t[j]!;
        if (soft[j] === 1) {
          excess[j] = weight[r]! - lambda[j]! - nu[j]!;
          missed = Math.max(missed, Math.abs(excess[j]!));
          gap += nu[j]! * e[j]!;
        }
        stiff[j] =
          1 / (t[j]! / lambda[j]! + (soft[j] === 1 ? e[j]! / nu[j]! : 0));
      }
      if (multiplier === 0) continue;
      const end: number = start[r + 1]!;
      for (let a: number = start[r]!; a < end; ++a)
        pulled[cols[a]!] = pulled[cols[a]!]! + vals[a]! * multiplier;
    }
    let stationary: number = 0;
    let drawn: number = 0;
    for (let i: number = 0; i < n; ++i) {
      drawn = Math.max(drawn, Math.abs(pulled[i]!));
      dual[i] = dual[i]! + pulled[i]!;
      stationary = Math.max(stationary, Math.abs(dual[i]!));
    }
    const mu: number = pairs === 0 ? 0 : gap / pairs;
    // A diverged step leaves no reading below infinity (NaN compares false).
    if (!(stationary < Infinity && missed < Infinity && mu < Infinity))
      return kept === undefined
        ? { state: undefined, converged: false }
        : ended();
    const within: (accuracy: number) => boolean = (
      accuracy: number,
    ): boolean =>
      stationary <= accuracy * Math.max(1, curved, drawn, s.qNorm) &&
      missed <= accuracy * Math.max(1, reached) &&
      mu <= accuracy;
    if (within(ACCURACY)) {
      kept = {
        state: Session.unscaled(s, x, value, lambda),
        point: Session.save(s, x, t, lambda, e, nu),
      };
      if (moved <= ACCURACY || ++held >= 2) return ended();
    } else held = 0;

    // The last iterate within the accepted accuracy is kept, should the
    // solve end short of the accuracy it aims at.
    if (kept === undefined && within(ACCEPTED))
      fair = Session.unscaled(s, x, value, lambda);
    if (it === ITERATIONS) break;

    // The reduced matrix, factored once for the predictor and the corrector.
    const matrices: Workspace.IFactor = Workspace.system(s, REGULAR, work);
    for (let r: number = 0; r < m; ++r) {
      const both: number = stiff[2 * r]! + stiff[2 * r + 1]!;
      if (both > 0) HumanQuadraticRow(s, matrices.system, r, both);
    }
    // A row whose radicand falls under the rounding of its own inner
    // product (Higham 2002, section 3.1: w terms carry w machine epsilons)
    // is dependent, and its pivot is skipped (Wright 1999).
    const factor: Workspace.IFactor = HumanQuadraticCholesky(
      matrices,
      (s.band + 1) * Number.EPSILON,
    );

    // The predictor, and the centring its longest step asks for.
    direction(factor, 0, false);
    let centring: number = 0;
    if (pairs !== 0 && mu > 0) {
      const affine: number = Math.min(1, longest());
      let left: number = 0;
      for (let j: number = 0; j < ends; ++j) {
        if (live[j] === 0 || free[j] === 1) continue;
        left +=
          (lambda[j]! + affine * dLambda[j]!) * (t[j]! + affine * dT[j]!);
        secondT[j] = dLambda[j]! * dT[j]!;
        if (soft[j] === 0) continue;
        left += (nu[j]! + affine * dNu[j]!) * (e[j]! + affine * dE[j]!);
        secondE[j] = dNu[j]! * dE[j]!;
      }
      centring = (left / pairs / mu) ** 3;
      direction(factor, centring * mu, true);
    }

    // One step for every variable, short of the boundary.
    const step: number = Math.min(1, BOUNDARY * longest());
    if (!(step > LEAST)) return ended();
    let far: number = 0;
    let size: number = 1;
    for (let i: number = 0; i < n; ++i) {
      far = Math.max(far, Math.abs(dx[i]!));
      x[i] = x[i]! + step * dx[i]!;
      size = Math.max(size, Math.abs(x[i]!));
    }
    moved = (step * far) / size;
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0) continue;
      lambda[j] = lambda[j]! + step * dLambda[j]!;
      if (free[j] === 1) continue;
      t[j] = t[j]! + step * dT[j]!;
      if (soft[j] === 0) continue;
      e[j] = e[j]! + step * dE[j]!;
      nu[j] = nu[j]! + step * dNu[j]!;
    }
  }
  return ended();
}

/*
 * What one interior-point solve reads and returns.
 */
export namespace HumanQuadraticInteriorRun {
  /*
   * The program's arrays a solve reads and writes, from the interior solve.
   */
  export interface IScope {
    /*
     * The equilibrated program.
     */
    s: B.IScaled;
    /*
     * The caller's session, absent for a solve alone.
     */
    session: Session.ISession | undefined;
    /*
     * The variables.
     */
    n: number;
    /*
     * The rows.
     */
    m: number;
    /*
     * Each row's first coefficient index.
     */
    start: B.IScaled["start"];
    /*
     * Each coefficient's variable.
     */
    cols: B.IScaled["cols"];
    /*
     * Each coefficient.
     */
    vals: B.IScaled["vals"];
    /*
     * Each row's weight, negative for a hard row.
     */
    weight: B.IScaled["weight"];
    /*
     * The ends, two per row.
     */
    ends: number;
    /*
     * Whether an end is live.
     */
    live: Uint8Array;
    /*
     * Whether an end is soft.
     */
    soft: Uint8Array;
    /*
     * Whether an end is an equality's.
     */
    free: Uint8Array;
    /*
     * Each end's bound.
     */
    bound: Float64Array;
    /*
     * The complementarity pairs.
     */
    pairs: number;
    /*
     * The variables.
     */
    x: Float64Array;
    /*
     * Each end's slack.
     */
    t: Float64Array;
    /*
     * Each end's multiplier.
     */
    lambda: Float64Array;
    /*
     * Each soft end's excess.
     */
    e: Float64Array;
    /*
     * Each soft end's excess multiplier.
     */
    nu: Float64Array;
    /*
     * Each row's value.
     */
    value: Float64Array;
    /*
     * Each row's product with the step.
     */
    along: Float64Array;
    /*
     * Each end's primal residual.
     */
    primal: Float64Array;
    /*
     * Each soft end's weight residual.
     */
    excess: Float64Array;
    /*
     * Each end's reduced stiffness.
     */
    stiff: Float64Array;
    /*
     * Each end's reduced residual.
     */
    rho: Float64Array;
    /*
     * Each end's multiplier step.
     */
    dLambda: Float64Array;
    /*
     * Each end's slack step.
     */
    dT: Float64Array;
    /*
     * Each soft end's excess step.
     */
    dE: Float64Array;
    /*
     * Each soft end's excess multiplier step.
     */
    dNu: Float64Array;
    /*
     * The predictor's slack products.
     */
    secondT: Float64Array;
    /*
     * The predictor's excess products.
     */
    secondE: Float64Array;
    /*
     * The stationarity residual.
     */
    dual: Float64Array;
    /*
     * The reduced system's right side.
     */
    rhs: Float64Array;
    /*
     * The variables' step.
     */
    dx: Float64Array;
    /*
     * The scratch.
     */
    work: Workspace.IWork;
  }

  /*
   * A solve's end: its state, and whether it met `ACCURACY`.
   */
  export interface IResult {
    /*
     * The state; undefined where the solve failed.
     */
    state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
    /*
     * Whether it met `ACCURACY`.
     */
    converged: boolean;
  }
}

/*
 * Iterations at most, a guard behind the residual test: ECOS's documented
 * default `max_iters` of 100 (Domahidi, Chu and Boyd 2013, "ECOS: An SOCP
 * solver for embedded systems", ECC; the solver's settings), an interior-point
 * method of the same predictor-corrector kind, whose iteration count does not
 * grow with the conditioning that slows a first-order method; a solve that
 * needs more is treated as failed and left to OSQP.
 */
const ITERATIONS: number = 100;

/*
 * The share of the longest positive step taken, so no slack or multiplier
 * reaches zero: this solver's value, provisional and unsourced, the customary
 * fraction to the boundary.
 */
const BOUNDARY: number = 0.995;

/*
 * A step length at or below which the iteration has stalled and the solve
 * fails: this solver's value, provisional and unsourced.
 */
const LEAST: number = 1e-10;

/*
 * The reduced matrix's added diagonal, in the equilibrated units where the
 * curvature's and the rows' entries are of order one: this solver's value,
 * provisional and unsourced, the square root of a double's rounding short of an
 * order, so it shifts no step by more than the factor's own accuracy.
 */
const REGULAR: number = 1e-9;

/*
 * An equality row's dual regularisation, in the equilibrated units: this
 * solver's value, provisional and unsourced, small enough that an iteration
 * leaves a millionth of its multiplier's step in the row's residual and large
 * enough that the step's cancellation `a.Delta x + r`, of a double's rounding,
 * moves the multiplier by no more than 1e-10.
 */
const EQUAL: number = 1e-6;

/*
 * The residuals' relative accuracy the solve aims at, on the equilibrated data:
 * this solver's value, provisional and unsourced, the square root of a double's
 * rounding, which a Newton iteration on a quadratic program reaches once its
 * active ends are found.
 */
const ACCURACY: number = 1e-8;

/*
 * The residuals' relative accuracy accepted from a solve that ends short of
 * `ACCURACY`: a thousandth of the OSQP solve's relative tolerance
 * (`HumanQuadraticProgram.TOLERANCE`), this solver's value, provisional, so an
 * accepted answer is never looser than the fallback's own.
 */
const ACCEPTED: number = 1e-6;

/*
 * The record of `IRunEndedResult`'s site.
 */
type IRunEndedResult = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
  converged: boolean;
};

/*
 * The record of `IHumanQuadraticInteriorRunKept`'s site.
 */
type IHumanQuadraticInteriorRunKept = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState;
  point: Session.IPoint;
};
