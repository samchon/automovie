import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/**
 * A banded convex quadratic program (`HumanQuadraticProgram.IProblem`)
 * solved by an infeasible-start primal-dual interior-point method with
 * Mehrotra's predictor and corrector, the scheme HPIPM implements (Frison
 * and Diehl 2020, "HPIPM: a high-performance quadratic programming framework
 * for model predictive control", sections 3.1, 3.3 and 4.2), on the data
 * equilibrated as the OSQP solve equilibrates them
 * (`HumanQuadraticPreparation.scaled`).
 *
 * The program. Each row `l <= a.x <= u` gives one inequality per finite
 * end, `c.x - e <= b` with `c = a, b = u` for the upper and `c = -a,
 * b = -l` for the lower; a hard row has no `e`, a soft row of weight `w`
 * has `e >= 0` at the cost `w e`, which is its exact l1 penalty (the slack
 * of Schulman et al. 2013, their (6)). With a slack `t >= 0`
 * and multipliers `lambda >= 0` of the inequality and `nu >= 0` of `e >= 0`,
 * the optimality conditions are
 *
 *     P x + q + sum c lambda = 0          (r_d)
 *     c.x - e + t - b = 0                 (r_p)
 *     w - lambda - nu = 0                 (r_e, soft ends)
 *     lambda t = tau,  nu e = tau         (r_c, r_s)
 *
 * with `tau` driven to zero. Newton's step on them, after `Delta t`,
 * `Delta e` and `Delta nu` are eliminated end by end (`Delta nu = r_e -
 * Delta lambda`, `Delta t = (-r_c - t Delta lambda) / lambda`, `Delta e =
 * (-r_s - e Delta nu) / nu`), leaves per end
 *
 *     Delta lambda = d (c.Delta x - rho),   d = 1 / (t / lambda + e / nu),
 *     rho = -r_p - (r_s + e r_e) / nu + r_c / lambda
 *
 * (the `e` terms absent for a hard end), and for the variables the reduced
 * system
 *
 *     (P + sum d a a^T) Delta x = -r_d + sum c d rho,
 *
 * HPIPM's (6), `H + C^T T^-1 Lambda C`, its slacks eliminated at a cost
 * linear in their number (their section 2). Every row couples variables
 * within the band, so the reduced matrix is banded and is factored by the
 * banded Cholesky factorisation the OSQP solve uses, at `O(n w^2)` an
 * iteration for `n` variables of half-bandwidth `w - 1`; a row of one
 * coefficient, a variable's bound, adds one diagonal entry.
 *
 * Each iteration factors once and solves twice: the predictor with `tau =
 * 0`, then the corrector with `tau = sigma mu` and the predictor's products
 * `Delta lambda Delta t` and `Delta nu Delta e` added to `r_c` and `r_s`,
 * where `mu` is the mean complementarity product and `sigma = (mu_aff /
 * mu)^3` from the mean the predictor's longest step would leave. One step
 * length serves the primal and the dual variables, `BOUNDARY` of the longest
 * that keeps every `t`, `e`, `lambda` and `nu` positive. The reduced matrix
 * takes `REGULAR` on its diagonal so that it is definite where the curvature
 * and the rows leave a direction free; the residuals are read on the
 * unregularised conditions at every iteration, so the regularisation
 * changes steps, never the point converged to (HPIPM regularises the same
 * way, section 4.2).
 *
 * The solve ends where the three residuals are within `ACCURACY` of their
 * scales, read on the equilibrated data. It gives up, returning nothing,
 * when `ITERATIONS` are spent, a step length collapses, a number is not
 * finite or a hard row holds no variable and excludes zero; the caller then
 * solves by OSQP, so a failure here costs time and never an answer.
 *
 * @param problem The program; its storage is unchanged during this synchronous solve.
 * @returns The unscaled variables, each row's value (a hard row's within its interval) and multiplier, with status `solved`; undefined when the method did not converge.
 * @throws {RangeError} For malformed or nonfinite input or noninvertible scaling, as `HumanQuadraticProgram.solve` throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the program, the optimality conditions, the elimination, the reduced system, the step rule, the regularisation, the termination, the failure cases and the units of the result.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's method on the perturbed optimality conditions of a convex program with Mehrotra's predictor-corrector, derived above and matching HPIPM's reduced system; convex curvature is the caller's premise as for the OSQP solve, and the method's own premises (positive slacks and multipliers) are kept by the step length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and equilibration stay with `HumanQuadraticPreparation`, the banded assembly, factor and substitution with the OSQP solve's owners; this file owns the iteration alone.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No row, bound or penalty is dropped or relaxed: a zero-weight soft end, which costs nothing, and an empty row, which holds no variable, are the only ends left out, and a hard empty row that excludes zero fails the solve. `ITERATIONS`, `BOUNDARY`, `REGULAR` and `ACCURACY` are named parameters with their origins stated; a solve that misses its accuracy returns nothing rather than an approximate answer.
 * @evidence contracts/development/implementation.md#efficient-algorithms An iteration costs O(n w^2 + n w + Z + m) for Z stored row coefficients and m rows, at most `ITERATIONS` of them, independent of the curvature's conditioning; storage is O(n w + n + m). No speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One factor serves an iteration's two solves; the equilibration is shared with every solve of the same numeric data through `HumanQuadraticPreparation.scaled`. Nothing is kept between solves.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All scratch is the call's own, one banded factor and O(n + m) vectors, released on return or throw; the returned arrays are fresh.
 */
export function HumanQuadraticInterior(
  problem: Q.IProblem,
): Q.IState | undefined {
  const s: B.IScaled = Preparation.scaled(problem);
  const { n, m, start, cols, vals, lo, hi, weight }: B.IScaled = s;

  // The ends: 2r is row r's upper end, 2r + 1 its lower. An end is live
  // when it is finite, its row holds a variable and, soft, it costs.
  const ends: number = 2 * m;
  const live: Uint8Array = new Uint8Array(ends);
  const soft: Uint8Array = new Uint8Array(ends);
  const bound: Float64Array = new Float64Array(ends);
  let pairs: number = 0;
  for (let r: number = 0; r < m; ++r) {
    const hard: boolean = weight[r]! < 0;
    if (start[r + 1] === start[r]) {
      if (hard && (hi[r]! < 0 || lo[r]! > 0)) return undefined;
      continue;
    }
    if (!hard && weight[r] === 0) continue;
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

  // The start: the origin, every slack at least a unit, every product at
  // most a unit, so the iterates begin away from every bound in the
  // equilibrated units.
  const x: Float64Array = new Float64Array(n);
  const t: Float64Array = new Float64Array(ends);
  const lambda: Float64Array = new Float64Array(ends);
  const e: Float64Array = new Float64Array(ends);
  const nu: Float64Array = new Float64Array(ends);
  for (let j: number = 0; j < ends; ++j) {
    if (live[j] === 0) continue;
    t[j] = Math.max(bound[j]!, 1);
    if (soft[j] === 0) lambda[j] = 1 / t[j]!;
    else {
      const w: number = weight[j >> 1]!;
      lambda[j] = Math.min(1 / t[j]!, w / 2);
      nu[j] = w - lambda[j]!;
      e[j] = 1 / Math.max(nu[j]!, 1);
    }
  }
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
  const work: Workspace.IWork = Workspace.of(
    new Float64Array(n),
    new Float64Array(n),
    new Float64Array(m),
  );

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
   * predictor's products: `rho` per end, the reduced system's solve, then
   * each end's own steps. The factor is the iteration's.
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
        const rc: number =
          lambda[j]! * t[j]! - target + (second ? secondT[j]! : 0);
        let at: number = -primal[j]! + rc / lambda[j]!;
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
      const rc: number =
        lambda[j]! * t[j]! - target + (second ? secondT[j]! : 0);
      dLambda[j] = stiff[j]! * (moved - rho[j]!);
      dT[j] = (-rc - t[j]! * dLambda[j]!) / lambda[j]!;
      if (soft[j] === 1) {
        const rs: number =
          nu[j]! * e[j]! - target + (second ? secondE[j]! : 0);
        dNu[j] = excess[j]! - dLambda[j]!;
        dE[j] = (-rs - e[j]! * dNu[j]!) / nu[j]!;
      }
    }
  };

  /** The longest step, at most one, that keeps every slack and multiplier nonnegative. */
  const longest: () => number = (): number => {
    let step: number = 1;
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0) continue;
      if (dT[j]! < 0) step = Math.min(step, -t[j]! / dT[j]!);
      if (dLambda[j]! < 0) step = Math.min(step, -lambda[j]! / dLambda[j]!);
      if (soft[j] === 0) continue;
      if (dE[j]! < 0) step = Math.min(step, -e[j]! / dE[j]!);
      if (dNu[j]! < 0) step = Math.min(step, -nu[j]! / dNu[j]!);
    }
    return step;
  };
  for (let it: number = 0; it < ITERATIONS; ++it) {
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
        primal[j] = c - e[j]! + t[j]! - bound[j]!;
        missed = Math.max(missed, Math.abs(primal[j]!));
        gap += lambda[j]! * t[j]!;
        multiplier += side === 0 ? lambda[j]! : -lambda[j]!;
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
      return undefined;
    if (
      stationary <= ACCURACY * Math.max(1, curved, drawn, s.qNorm) &&
      missed <= ACCURACY * Math.max(1, reached) &&
      mu <= ACCURACY
    )
      return unscaled(s, x, value, lambda);

    // The reduced matrix, factored once for the predictor and the corrector.
    const matrices: Workspace.IFactor = Workspace.system(s, REGULAR, work);
    for (let r: number = 0; r < m; ++r) {
      const both: number = stiff[2 * r]! + stiff[2 * r + 1]!;
      if (both > 0) HumanQuadraticRow(s, matrices.system, r, both);
    }
    const factor: Workspace.IFactor = HumanQuadraticCholesky(matrices);

    // The predictor, and the centring its longest step asks for.
    direction(factor, 0, false);
    let centring: number = 0;
    if (pairs !== 0 && mu > 0) {
      const affine: number = longest();
      let left: number = 0;
      for (let j: number = 0; j < ends; ++j) {
        if (live[j] === 0) continue;
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
    if (!(step > LEAST)) return undefined;
    for (let i: number = 0; i < n; ++i) x[i] = x[i]! + step * dx[i]!;
    for (let j: number = 0; j < ends; ++j) {
      if (live[j] === 0) continue;
      t[j] = t[j]! + step * dT[j]!;
      lambda[j] = lambda[j]! + step * dLambda[j]!;
      if (soft[j] === 0) continue;
      e[j] = e[j]! + step * dE[j]!;
      nu[j] = nu[j]! + step * dNu[j]!;
    }
  }
  return undefined;
}

/**
 * The converged iterate in the problem's own units: `x = D x`, each row's
 * value `E^-1 (a.x)`, a hard row's held within its interval, and its
 * multiplier `E (lambda_upper - lambda_lower) / c`, the sign the OSQP
 * solve's multipliers have.
 */
function unscaled(
  s: B.IScaled,
  x: Float64Array,
  value: Float64Array,
  lambda: Float64Array,
): Q.IState {
  const out: Q.IState = {
    x: new Float64Array(s.n),
    z: new Float64Array(s.m),
    y: new Float64Array(s.m),
    status: "solved",
  };
  for (let i: number = 0; i < s.n; ++i) out.x[i] = s.d[i]! * x[i]!;
  for (let r: number = 0; r < s.m; ++r) {
    const held: number =
      s.weight[r]! < 0
        ? Math.min(s.hi[r]!, Math.max(s.lo[r]!, value[r]!))
        : value[r]!;
    out.z[r] = held / s.e[r]!;
    out.y[r] = (s.e[r]! * (lambda[2 * r]! - lambda[2 * r + 1]!)) / s.c;
  }
  return out;
}

/** Iterations at most, a guard behind the residual test: this solver's value, provisional and unsourced (a predictor-corrector iteration count does not grow with the conditioning that slows a first-order method, so a solve that needs more is treated as failed and left to OSQP). */
const ITERATIONS: number = 50;

/** The share of the longest positive step taken, so no slack or multiplier reaches zero: this solver's value, provisional and unsourced, the customary fraction to the boundary. */
const BOUNDARY: number = 0.995;

/** A step length at or below which the iteration has stalled and the solve fails: this solver's value, provisional and unsourced. */
const LEAST: number = 1e-10;

/** The reduced matrix's added diagonal, in the equilibrated units where the curvature's and the rows' entries are of order one: this solver's value, provisional and unsourced, the square root of a double's rounding short of an order, so it shifts no step by more than the factor's own accuracy. */
const REGULAR: number = 1e-9;

/** The residuals' relative accuracy on the equilibrated data: a thousandth of the OSQP solve's relative tolerance (`HumanQuadraticProgram.TOLERANCE`), this solver's value, provisional, chosen so the outer loop's predicted decrease is read well inside its own settling threshold. */
const ACCURACY: number = 1e-6;
