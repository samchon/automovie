import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticInteriorRun } from "./HumanQuadraticInteriorRun";
import { HumanQuadraticInteriorSession as Session } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/*
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
 * Parameter problem: The program; its storage is unchanged during this synchronous
 * solve.
 * Parameter session: The caller's session; absent, the solve is alone, equilibrated
 * by the ten passes and started cold.
 * Returns: The unscaled variables, each row's value (a hard row's within its
 * interval) and multiplier, with status `solved`; undefined when the method
 * did not converge.
 * For malformed input or noninvertible scaling, as
 * `HumanQuadraticProgram.solve` throws.
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
    work = Workspace(
      new Float64Array(n),
      new Float64Array(n),
      new Float64Array(m),
    );
    if (session !== undefined) session.work = { n, m, work };
  }

  const scope: HumanQuadraticInteriorRun.IScope = {
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
  };
  const run: () => HumanQuadraticInteriorRun.IResult =
    (): HumanQuadraticInteriorRun.IResult => HumanQuadraticInteriorRun(scope);

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

/*
 * The record of `IHumanQuadraticInteriorWarmed`'s site.
 */
type IHumanQuadraticInteriorWarmed = {
  state: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
  converged: boolean;
};
