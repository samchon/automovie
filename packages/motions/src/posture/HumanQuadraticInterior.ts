import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticInteriorSession as Session } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/** The record of `IHumanQuadraticInteriorWarmed`'s site. */
type IHumanQuadraticInteriorWarmed = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
  converged: boolean;
};

/** The record of `IRunEndedResult`'s site. */
type IRunEndedResult = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
  converged: boolean;
};

/** The record of `IHumanQuadraticInteriorRunKept`'s site. */
type IHumanQuadraticInteriorRunKept = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState;
  point: Session.IPoint;
};

/** The record of `IHumanQuadraticInteriorRunResult`'s site. */
type IHumanQuadraticInteriorRunResult = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
  converged: boolean;
};

/**
 * A banded convex quadratic program (`HumanQuadraticProgram.IProblem`) solved
 * by an infeasible-start primal-dual interior-point method with Mehrotra's
 * predictor and corrector, the scheme HPIPM implements (Frison and Diehl 2020,
 * "HPIPM: a high-performance quadratic programming framework for model
 * predictive control", sections 3.1, 3.3 and 4.2), on the data equilibrated as
 * the OSQP solve equilibrates them (`HumanQuadraticPreparation.scaled`).
 *
 * The program. Each row `l <= a.x <= u` gives one inequality per finite end,
 * `c.x - e <= b` with `c = a, b = u` for the upper and `c = -a, b = -l` for the
 * lower; a hard row has no `e`, a soft row of weight `w` has `e >= 0` at the
 * cost `w e`, which is its exact l1 penalty (the slack of Schulman et al. 2013,
 * their (6)). With a slack `t >= 0` and multipliers `lambda >= 0` of the
 * inequality and `nu >= 0` of `e >= 0`, the optimality conditions are
 *
 *     P x + q + sum c lambda = 0          (r_d)
 *     c.x - e + t - b = 0                 (r_p)
 *     w - lambda - nu = 0                 (r_e, soft ends)
 *     lambda t = tau,  nu e = tau         (r_c, r_s)
 *
 * With `tau` driven to zero. Newton's step on them, after `Delta t`, `Delta e`
 * and `Delta nu` are eliminated end by end (`Delta nu = r_e - Delta lambda`,
 * `Delta t = (-r_c - t Delta lambda) / lambda`, `Delta e = (-r_s - e Delta nu)
 * / nu`), leaves per end
 *
 *     Delta lambda = d (c.Delta x - rho),   d = 1 / (t / lambda + e / nu),
 *     rho = -r_p - (r_s + e r_e) / nu + r_c / lambda
 *
 * (the `e` terms absent for a hard end), and for the variables the reduced
 * system
 *
 *     (P + sum d a a^T) Delta x = -r_d + sum c d rho,
 *
 * HPIPM's (6), `H + C^T T^-1 Lambda C`, its slacks eliminated at a cost linear
 * in their number (their section 2). Every row couples variables within the
 * band, so the reduced matrix is banded and is factored by the banded Cholesky
 * factorisation the OSQP solve uses, at `O(n w^2)` an iteration for `n`
 * variables of half-bandwidth `w - 1`; a row of one coefficient, a variable's
 * bound, adds one diagonal entry.
 *
 * Each iteration factors once and solves twice: the predictor with `tau = 0`,
 * then the corrector with `tau = sigma mu` and the predictor's products `Delta
 * lambda Delta t` and `Delta nu Delta e` added to `r_c` and `r_s`, where `mu`
 * is the mean complementarity product and `sigma = (mu_aff / mu)^3` from the
 * mean the predictor's longest step would leave. One step length serves the
 * primal and the dual variables: the full Newton step, or `BOUNDARY` of the
 * longest that keeps every `t`, `e`, `lambda` and `nu` positive where that is
 * shorter. The reduced matrix takes `REGULAR` on its diagonal so that it is
 * definite where the curvature and the rows leave a direction free; the
 * residuals are read on the unregularised conditions at every iteration, so the
 * regularisation changes steps, never the point converged to (HPIPM regularises
 * the same way, section 4.2).
 *
 * A hard row with equal ends is one equation `a.x = b` with a multiplier of
 * either sign and no slack: its step is `Delta lambda = (a.Delta x + r) /
 * EQUAL` for its residual `r = a.x - b`, the regularised equation `a. Delta x -
 * EQUAL Delta lambda = -r` (the dual regularisation of OSQP's polishing system,
 * Stellato et al. 2020, their (30)), so it enters the reduced matrix as `a a^T
 * / EQUAL` and takes no part in the step length or the centring; each iteration
 * leaves `EQUAL Delta lambda` of its residual, which the next removes.
 *
 * The solve ends where the three residuals (stationarity, the rows' equations
 * and the mean product) are within `ACCURACY` of their scales, read on the
 * equilibrated data, and have held through one further Newton step. Near the
 * solution the reduced matrix grows rows rounding makes dependent; each such
 * pivot is skipped (`HumanQuadraticCholesky`'s `dependent`, Wright 1999), and
 * where a confirming step is still spoilt by them, or the solve ends short in
 * any other way after an iterate met `ACCURACY`, the last such iterate is the
 * answer, converged. Where none did and `ITERATIONS` are spent or a step length
 * collapses, the last iterate within `ACCEPTED` is returned unconverged;
 * otherwise, and where a number is not finite or a hard row holds no variable
 * and excludes zero, the solve returns nothing and the caller solves by OSQP,
 * so a failure here costs time and never an answer.
 *
 * With a session (`HumanQuadraticInteriorSession.ISession`, one caller's solves
 * of one optimisation's subproblems), the session's first solve's variable and
 * cost scales scale every later solve (`HumanQuadraticPreparation.scaled`'s
 * `fixed`, one pass in place of ten), its last preparation is reused for a
 * program of the same data and scaling, the scratch is kept for programs of the
 * same sizes, and a program of the same rows as the last converged one starts
 * from its point shifted into the interior
 * (`HumanQuadraticInteriorSession.warm`); a warm solve that ends short of
 * `ACCURACY` is solved again cold.
 *
 * @param problem The program; its storage is unchanged during this synchronous
 *   solve.
 * @param session The caller's session; absent, the solve is alone, equilibrated
 *   by the ten passes and started cold.
 * @returns The unscaled variables, each row's value (a hard row's within its
 *   interval) and multiplier, with status `solved`; undefined when the method
 *   did not converge.
 * @throws {RangeError} For malformed or nonfinite input or noninvertible
 *   scaling, as `HumanQuadraticProgram.solve` throws.
 */
export function HumanQuadraticInterior(
  problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  session?: Session.ISession,
): IAutoMovieMotionHumanQuadraticProgram.IState | undefined {
  // A session's later solves are scaled by its first one's variable and
  // cost scales (`HumanQuadraticPreparation.IScaling`).
  const s: B.IScaled = Preparation.scaled(problem, session?.scaling, session);
  if (session !== undefined && session.scaling === undefined)
    session.scaling = { d: Float64Array.from(s.d), c: s.c };
  const { n, m, start, cols, vals, lo, hi, weight }: B.IScaled = s;

  // The ends: 2r is row r's upper end, 2r + 1 its lower. An end is live
  // when it is finite, its row holds a variable and, soft, it costs.
  const ends: number = 2 * m;
  const live: Uint8Array = new Uint8Array(ends);
  const soft: Uint8Array = new Uint8Array(ends);
  const free: Uint8Array = new Uint8Array(ends);
  const bound: Float64Array = new Float64Array(ends);
  let pairs: number = 0;
  for (let r: number = 0; r < m; ++r) {
    const hard: boolean = weight[r]! < 0;
    if (start[r + 1] === start[r]) {
      if (hard && (hi[r]! < 0 || lo[r]! > 0)) return undefined;
      continue;
    }
    if (!hard && weight[r] === 0) continue;
    if (hard && lo[r] === hi[r]) {
      // An equality: one end with a multiplier of either sign.
      live[2 * r] = 1;
      free[2 * r] = 1;
      bound[2 * r] = hi[r]!;
      continue;
    }
    for (let side: number = 0; side < 2; ++side) {
      const b: number = side === 0 ? hi[r]! : -lo[r]!;
      if (b === Infinity) continue;
      const j: number = 2 * r + side;
      live[j] = 1;
      bound[j] = b;
      pairs += 1;
      if (!hard) {
        soft[j] = 1;
        pairs += 1;
      }
    }
  }

  const x: Float64Array = new Float64Array(n);
  const t: Float64Array = new Float64Array(ends);
  const lambda: Float64Array = new Float64Array(ends);
  const e: Float64Array = new Float64Array(ends);
  const nu: Float64Array = new Float64Array(ends);

  // The cold start: the origin, every slack at least a unit, every product
  // at most a unit, so the iterates begin away from every bound in the
  // equilibrated units.
  const cold = (): void => {
    x.fill(0);
    t.fill(0);
    lambda.fill(0);
    e.fill(0);
    nu.fill(0);
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0 || free[j] === 1) continue;
      t[j] = Math.max(bound[j]!, 1);
      if (soft[j] === 0) lambda[j] = 1 / t[j]!;
      else {
        const w: number = weight[j >> 1]!;
        lambda[j] = Math.min(1 / t[j]!, w / 2);
        nu[j] = w - lambda[j]!;
        e[j] = 1 / Math.max(nu[j]!, 1);
      }
    }
  };
  const value: Float64Array = new Float64Array(m);
  const along: Float64Array = new Float64Array(m);
  const primal: Float64Array = new Float64Array(ends);
  const excess: Float64Array = new Float64Array(ends);
  const stiff: Float64Array = new Float64Array(ends);
  const rho: Float64Array = new Float64Array(ends);
  const dLambda: Float64Array = new Float64Array(ends);
  const dT: Float64Array = new Float64Array(ends);
  const dE: Float64Array = new Float64Array(ends);
  const dNu: Float64Array = new Float64Array(ends);
  const secondT: Float64Array = new Float64Array(ends);
  const secondE: Float64Array = new Float64Array(ends);
  const dual: Float64Array = new Float64Array(n);
  const rhs: Float64Array = new Float64Array(n);
  const dx: Float64Array = new Float64Array(n);
  // A session keeps the scratch for programs of its sizes; the system band
  // is reset from the curvature at every iteration (`Workspace.system`).
  let work: Workspace.IWork;
  if (
    session?.work !== undefined &&
    session.work.n === n &&
    session.work.m === m
  )
    work = session.work.work;
  else {
    work = Workspace.of(
      new Float64Array(n),
      new Float64Array(n),
      new Float64Array(m),
    );
    if (session !== undefined) session.work = { n, m, work };
  }

  /** Each row's product with a vector of the variables. */
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

  /**
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

  /**
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

  // One solve from the iterate the arrays hold, cold or warm: the state it
  // ends with, and whether it met `ACCURACY` (a converged solve, whose point
  // a session keeps for the next program of the same rows).
  const run = (): IHumanQuadraticInteriorRunResult => {
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
      if (
        !Number.isFinite(stationary) ||
        !Number.isFinite(missed) ||
        !Number.isFinite(mu)
      )
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
  };

  // A session's program of the same rows as its last converged one starts
  // from that point (`HumanQuadraticInteriorSession.warm`); a warm solve that
  // ends short of `ACCURACY` is solved again cold, so every answer is a
  // converged solve's or the cold solve's.
  if (
    session?.point !== undefined &&
    Session.warm(
      s,
      session.point,
      live,
      soft,
      free,
      bound,
      x,
      t,
      lambda,
      e,
      nu,
      value,
    )
  ) {
    const warmed: IHumanQuadraticInteriorWarmed = run();
    if (warmed.converged) return warmed.state;
  }
  cold();
  return run().state;
}

/**
 * Iterations at most, a guard behind the residual test: ECOS's documented
 * default `max_iters` of 100 (Domahidi, Chu and Boyd 2013, "ECOS: An SOCP
 * solver for embedded systems", ECC; the solver's settings), an interior-point
 * method of the same predictor-corrector kind, whose iteration count does not
 * grow with the conditioning that slows a first-order method; a solve that
 * needs more is treated as failed and left to OSQP.
 */
const ITERATIONS: number = 100;

/**
 * The share of the longest positive step taken, so no slack or multiplier
 * reaches zero: this solver's value, provisional and unsourced, the customary
 * fraction to the boundary.
 */
const BOUNDARY: number = 0.995;

/**
 * A step length at or below which the iteration has stalled and the solve
 * fails: this solver's value, provisional and unsourced.
 */
const LEAST: number = 1e-10;

/**
 * The reduced matrix's added diagonal, in the equilibrated units where the
 * curvature's and the rows' entries are of order one: this solver's value,
 * provisional and unsourced, the square root of a double's rounding short of an
 * order, so it shifts no step by more than the factor's own accuracy.
 */
const REGULAR: number = 1e-9;

/**
 * An equality row's dual regularisation, in the equilibrated units: this
 * solver's value, provisional and unsourced, small enough that an iteration
 * leaves a millionth of its multiplier's step in the row's residual and large
 * enough that the step's cancellation `a.Delta x + r`, of a double's rounding,
 * moves the multiplier by no more than 1e-10.
 */
const EQUAL: number = 1e-6;

/**
 * The residuals' relative accuracy the solve aims at, on the equilibrated data:
 * this solver's value, provisional and unsourced, the square root of a double's
 * rounding, which a Newton iteration on a quadratic program reaches once its
 * active ends are found.
 */
const ACCURACY: number = 1e-8;

/**
 * The residuals' relative accuracy accepted from a solve that ends short of
 * `ACCURACY`: a thousandth of the OSQP solve's relative tolerance
 * (`HumanQuadraticProgram.TOLERANCE`), this solver's value, provisional, so an
 * accepted answer is never looser than the fallback's own.
 */
const ACCEPTED: number = 1e-6;
