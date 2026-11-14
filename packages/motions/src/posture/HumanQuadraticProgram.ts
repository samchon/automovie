import { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * A convex quadratic program with banded curvature and sparse rows, solved
 * by OSQP (Stellato, Banjac, Goulart, Bemporad and Boyd 2020, "OSQP: an
 * operator splitting solver for quadratic programs", Math Program Comput
 * 12:637): minimise `½ xᵀPx + qᵀx` over rows `l <= a·x <= u`, each row hard
 * (projected onto its interval) or soft (an exact l1 penalty `weight ×` its
 * distance from the interval, whose proximal step is a soft threshold toward
 * it), the form of the convex subproblem of TrajOpt's sequential convex
 * optimisation (Schulman et al. 2014, IJRR 33:1251).
 *
 * As the paper prescribes:
 * - the data are equilibrated first (section 5.1): modified Ruiz scaling of
 *   the KKT matrix's columns, the variables by `D`, the rows by `E` and the
 *   cost by `c`, so rows of millimetres and of degrees meet the same step;
 * - each row has its own step size (section 5.2): an equality row a
 *   thousand times the step, a row bounded on neither side the least;
 * - the step size adapts (section 5.2) to balance the primal and the dual
 *   residuals, the step's system factored again when it changes fivefold;
 * - the iteration stops on the primal and dual residuals of the unscaled
 *   problem (section 3.4), or on a certificate of primal infeasibility
 *   (section 3.4), `ITERATIONS` only a guard;
 * - a solved problem is polished (section 4): the KKT system of the rows the
 *   solution holds on their bounds is solved, regularised and refined, so
 *   those rows are met to numerical precision, and the polished solution is
 *   kept when its residuals are no larger.
 *
 * The curvature and the rows only couple variables within `band` of each
 * other, so every linear system is the banded reduced form `P + σI + Aᵀ
 * diag(ρ) A` (the paper's indirect form), factored by a banded Cholesky
 * factorisation (`HumanQuadraticBand`). A warm start carries the iterates of
 * a solve of the same rows with other bounds.
 */
export namespace HumanQuadraticProgram {
  /** One row: `l <= Σ coef·x[index] <= u`. */
  export interface IRow {
    /** The constraint the row linearises, so a later solve of the next convexification starts from its multiplier. */
    key?: string;
    /** The variables the row reads. */
    index: readonly number[];
    /** Each variable's coefficient, in `index`'s order. */
    coef: readonly number[];
    /** The interval's lower end; `-Infinity` for none. */
    l: number;
    /** The interval's upper end; `Infinity` for none. */
    u: number;
    /** The l1 penalty weight; absent for a hard row. */
    weight?: number;
  }

  /** The problem. */
  export interface IProblem {
    /** The number of variables. */
    n: number;
    /** Half-bandwidth of the curvature and of every row's coupling. */
    band: number;
    /** The curvature's band, `p[i][j]` the entry `(i, i + j)`. */
    p: Float64Array[];
    /** The linear term. */
    q: Float64Array;
    /** The rows, hard or soft. */
    rows: readonly IRow[];
  }

  /** A solve's iterates, to warm-start another solve of the same rows, and how the solve ended. */
  export interface IState {
    /** The variables. */
    x: Float64Array;
    /** Each row's value as the splitting holds it, inside or penalised toward its interval. */
    z: Float64Array;
    /** Each row's multiplier. */
    y: Float64Array;
    /** Why the solve stopped: its residuals met (`solved`, and `polished` when the active set's solve was kept), the hard rows certified infeasible, or the guard reached. */
    status?: "solved" | "polished" | "infeasible" | "unfinished";
    /** The unscaled primal and dual residuals the solve ended at, their infinity norms. */
    residual?: { primal: number; dual: number };
  }

  /**
   * A solve's multipliers by its rows' keys, for the next convexification to
   * start from.
   *
   * @param problem The problem solved.
   * @param state Its solve's iterates.
   * @returns Each keyed row's multiplier.
   */
  export function multipliers(problem: IProblem, state: IState): Map<string, number> {
    const out: Map<string, number> = new Map();
    problem.rows.forEach((row: IRow, r: number): void => {
      if (row.key !== undefined) out.set(row.key, state.y[r]!);
    });
    return out;
  }

  /**
   * The minimiser.
   *
   * @param problem The problem.
   * @param warm The iterates of a solve of the same rows; zero when absent.
   * @param duals Multipliers by row key from a solve of other rows that linearise the same constraints, read when `warm` is absent.
   * @returns The iterates, unscaled; `x` is the minimiser.
   */
  export function solve(problem: IProblem, warm?: IState, duals?: ReadonlyMap<string, number>): IState {
    const s: B.IScaled = B.scaled(problem);
    const { n, m, start, cols, vals, lo, hi, weight, d, e } = s;
    const c: number = s.c;
    // Each row's step size: an equality row's a thousand times the step, a
    // row bounded on neither side the least (section 5.2).
    let base: number = RHO0;
    const rho: Float64Array = new Float64Array(m);
    const steps = (): void => {
      for (let r: number = 0; r < m; ++r)
        rho[r] = lo[r] === -Infinity && hi[r] === Infinity ? RHO_MIN : lo[r] === hi[r] ? EQUALITY * base : base;
    };
    steps();
    let factor: Float64Array[] = B.factor(s, rho, SIGMA);

    // The iterates in the scaled problem: x̄ = D⁻¹x, z̄ = E z, ȳ = c E⁻¹ y.
    const x: Float64Array = new Float64Array(n);
    const z: Float64Array = new Float64Array(m);
    const y: Float64Array = new Float64Array(m);
    if (warm !== undefined) {
      for (let i: number = 0; i < n; ++i) x[i] = warm.x[i]! / d[i]!;
      for (let r: number = 0; r < m; ++r) {
        z[r] = warm.z[r]! * e[r]!;
        y[r] = (c * warm.y[r]!) / e[r]!;
      }
    } else
      problem.rows.forEach((row: IRow, r: number): void => {
        // A solve of new rows starts from the multipliers of the rows they
        // linearise again (`IRow.key`), the primal at the iterate itself.
        const known: number | undefined = row.key === undefined || duals === undefined ? undefined : duals.get(row.key);
        if (known !== undefined) y[r] = (c * known) / e[r]!;
        z[r] = Math.min(hi[r]!, Math.max(lo[r]!, 0));
      });

    const rhs: Float64Array = new Float64Array(n);
    const xt: Float64Array = new Float64Array(n);
    const tilde: Float64Array = new Float64Array(m);
    const before: Float64Array = new Float64Array(m);
    let status: IState["status"] = "unfinished";
    let residual: { primal: number; dual: number } = { primal: Infinity, dual: Infinity };
    for (let it: number = 0; it < ITERATIONS; ++it) {
      // The ADMM step (algorithm 1), in the reduced form.
      for (let i: number = 0; i < n; ++i) rhs[i] = SIGMA * x[i]! - s.q[i]!;
      for (let r: number = 0; r < m; ++r) {
        const w: number = rho[r]! * z[r]! - y[r]!;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a) rhs[cols[a]!]! += vals[a]! * w;
      }
      B.substitute(factor, n, s.band, rhs, xt);
      for (let r: number = 0; r < m; ++r) {
        let v: number = 0;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a) v += vals[a]! * xt[cols[a]!]!;
        tilde[r] = v;
      }
      for (let i: number = 0; i < n; ++i) x[i] = ALPHA * xt[i]! + (1 - ALPHA) * x[i]!;
      for (let r: number = 0; r < m; ++r) {
        before[r] = y[r]!;
        const relaxed: number = ALPHA * tilde[r]! + (1 - ALPHA) * z[r]!;
        const v: number = relaxed + y[r]! / rho[r]!;
        const l: number = lo[r]!;
        const u: number = hi[r]!;
        let next: number;
        if (weight[r]! < 0) next = Math.min(u, Math.max(l, v));
        else {
          const t: number = weight[r]! / rho[r]!;
          next = v > u + t ? v - t : v > u ? u : v < l - t ? v + t : v < l ? l : v;
        }
        y[r] = y[r]! + rho[r]! * (relaxed - next);
        z[r] = next;
      }
      if ((it + 1) % CHECK !== 0 && it + 1 < ITERATIONS) continue;

      // Termination on the unscaled residuals (section 3.4).
      const at: B.IResiduals = B.residuals(s, x, z, y);
      residual = { primal: at.primal, dual: at.dual };
      if (at.primal <= ABSOLUTE + RELATIVE * at.primalScale && at.dual <= ABSOLUTE + RELATIVE * at.dualScale) {
        status = "solved";
        break;
      }
      // A certificate of primal infeasibility of the hard rows (section 3.4).
      if (B.infeasible(s, y, before, INFEASIBLE)) {
        status = "infeasible";
        break;
      }
      // The step size balancing the scaled residuals (section 5.2).
      const ratio: number = Math.sqrt(
        at.scaledPrimal / Math.max(1e-12, at.scaledPrimalScale) / Math.max(1e-12, at.scaledDual / Math.max(1e-12, at.scaledDualScale)),
      );
      const next: number = Math.min(RHO_MAX, Math.max(RHO_MIN, base * ratio));
      if (next > ADAPT * base || next < base / ADAPT) {
        base = next;
        steps();
        factor = B.factor(s, rho, SIGMA);
      }
    }

    // Polishing on the active set (section 4).
    if (status === "solved") {
      const polished: { x: Float64Array; z: Float64Array; y: Float64Array } | undefined = B.polish(s, z, y, DELTA, REFINE);
      if (polished !== undefined) {
        const at: B.IResiduals = B.residuals(s, polished.x, polished.z, polished.y);
        const primalOk: boolean = at.primal <= residual.primal || at.primal <= ABSOLUTE + RELATIVE * at.primalScale;
        const dualOk: boolean = at.dual <= residual.dual || at.dual <= ABSOLUTE + RELATIVE * at.dualScale;
        if (primalOk && dualOk) {
          x.set(polished.x);
          z.set(polished.z);
          y.set(polished.y);
          residual = { primal: at.primal, dual: at.dual };
          status = "polished";
        }
      }
    }

    // The unscaled iterates: x = D x̄, z = E⁻¹ z̄, y = E ȳ / c.
    const out: IState = { x: new Float64Array(n), z: new Float64Array(m), y: new Float64Array(m), status, residual };
    for (let i: number = 0; i < n; ++i) out.x[i] = d[i]! * x[i]!;
    for (let r: number = 0; r < m; ++r) {
      out.z[r] = z[r]! / e[r]!;
      out.y[r] = (e[r]! * y[r]!) / c;
    }
    return out;
  }

  /**
   * The value of `½ xᵀPx + qᵀx` plus each soft row's penalty: a trust
   * region's model of the merit.
   *
   * @param problem The problem.
   * @param x The variables.
   * @returns The value.
   */
  export function value(problem: IProblem, x: Float64Array): number {
    let v: number = 0;
    for (let i: number = 0; i < problem.n; ++i) {
      v += problem.q[i]! * x[i]!;
      v += 0.5 * problem.p[i]![0]! * x[i]! * x[i]!;
      for (let j: number = 1; j <= problem.band && i + j < problem.n; ++j) v += problem.p[i]![j]! * x[i]! * x[i + j]!;
    }
    for (const row of problem.rows) {
      if (row.weight === undefined) continue;
      let s: number = 0;
      for (let a: number = 0; a < row.index.length; ++a) s += row.coef[a]! * x[row.index[a]!]!;
      v += row.weight * Math.max(0, row.l - s, s - row.u);
    }
    return v;
  }
}

/** The step size the solve starts from (OSQP's default). */
const RHO0: number = 0.1;

/** The least and the greatest step size (OSQP's bounds). */
const RHO_MIN: number = 1e-6;
const RHO_MAX: number = 1e6;

/** An equality row's step size as a multiple of the others' (OSQP's). */
const EQUALITY: number = 1e3;

/** The factor the estimated step size must leave the current one by before the system is factored again (OSQP's adaptive tolerance). */
const ADAPT: number = 5;

/** The proximal term that keeps the step's system definite (OSQP's σ). */
const SIGMA: number = 1e-6;

/** Over-relaxation (OSQP's α). */
const ALPHA: number = 1.6;

/** ADMM iterations per solve at most, a guard behind the residual test (OSQP's default). */
const ITERATIONS: number = 4000;

/** Iterations between two residual tests (OSQP's default). */
const CHECK: number = 25;

/** The residual tests' absolute and relative tolerances (OSQP's defaults). */
const ABSOLUTE: number = 1e-3;
const RELATIVE: number = 1e-3;

/** The primal infeasibility certificate's tolerance (OSQP's default). */
const INFEASIBLE: number = 1e-4;

/** The polishing system's regularisation (OSQP's δ). */
const DELTA: number = 1e-6;

/** Iterative refinement steps of the polishing solve (OSQP's default). */
const REFINE: number = 3;
