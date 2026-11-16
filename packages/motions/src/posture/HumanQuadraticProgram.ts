import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

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
 * a solve of the same rows with other bounds. `HumanQuadraticPreparation`
 * shares copied numeric preparation and its initial factor only after exact
 * P, q and ordered nonzero A comparisons; each solve owns its bounds,
 * iterates and adaptive step sizes.
 * Costs use w=band+1, S supplied curvature entries, Z stored row entries
 * and m rows, including diagonal systems and supplied curvature padding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the convex objective, hard and soft rows, OSQP stages, band representation, warm iterates and exact numeric preparation sharing.
 * @evidence contracts/development/design.md#principled-representation Groups the convex program, ordered sparse rows and unscaled primal-dual state; their interfaces state numeric and dimensional premises while runtime admission checks finite structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the existing solver, objective and keyed multipliers used by motion planners; preparation and banded algebra remain internal modules.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the generic numeric program independent of bodies and action names; positive semidefinite curvature remains an explicit caller premise rather than a validated type guarantee.
 */
export namespace HumanQuadraticProgram {
  /**
   * Relative residual tolerance, OSQP's eps_rel; it does not bound each
   * variable's error independently of conditioning.
   *
   * Names the inherited relative residual tolerance and distinguishes residual convergence from a componentwise solution-error guarantee.
   */
  export const TOLERANCE: number = 1e-3;

  /**
   * One ordered row `l <= Σ coef·x[index] <= u`, in its own consistent
   * linear units. A soft weight has objective units per row unit.
   *
   * @evidence contracts/development/design.md#principled-representation Models a closed linear interval or its nonnegative l1 penalty; parallel indices and coefficients preserve duplicates, and solve validates lengths, finite values, indices and bound order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The quadratic solver consumes the coefficients, interval and optional penalty; current SQP callers also use key to carry multipliers between convexifications.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same row for every numeric constraint without body-specific cases; absence of weight means hard and zero weight remains a genuine soft row.
   * @evidence contracts/development/common.md#meaningful-documentation States the linear form, row and penalty units, original ordering, zero compression and the meanings of optional key and weight.
   */
  export interface IRow {
    /** The constraint the row linearises, so a later solve of the next convexification starts from its multiplier. */
    key?: string;

    /** Integer variable indices in [0, n); order and duplicate indices are preserved. */
    index: readonly number[];

    /** Finite coefficients, one per index; exact positive and negative zeros are omitted internally. */
    coef: readonly number[];

    /** The interval's lower end; `-Infinity` for none. */
    l: number;

    /** The interval's upper end; `Infinity` for none. */
    u: number;

    /** Finite nonnegative l1 penalty weight; absent for a hard row. */
    weight?: number;
  }

  /**
   * A convex quadratic program. Curvature P must be positive semidefinite;
   * admission validates finite storage, not convexity. P and q use objective
   * units per variable squared and per variable respectively. Each P row
   * supplies at least its in-range band entries; supplied trailing entries
   * are finite but do not contribute beyond the last variable.
   *
   * @evidence contracts/development/design.md#principled-representation Stores the upper band of symmetric P, q and ordered sparse rows; solve checks nonnegative integer dimensions and finite compatible storage, while positive semidefiniteness remains a caller premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only data consumed by the common quadratic solver and objective reader; each motion planner owns constructing its numeric convexification.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains arbitrary supported band widths, sparse rows and soft penalties without fixture or action categories; mutable arrays are compared numerically before reuse.
   * @evidence contracts/development/common.md#meaningful-documentation Defines convexity, units, upper-band indexing, finite storage and trailing-entry behavior.
   */
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

  /**
   * Unscaled primal-dual iterates for a solve of the same ordered rows.
   * Each returned array is newly owned by the caller. Status and residual
   * remain optional so callers may also supply manual warm iterates.
   *
   * @evidence contracts/development/design.md#principled-representation Carries variable values, split row values and row multipliers in original units; solve validates warm dimensions and finiteness, and solved status reports residual convergence rather than exact arithmetic.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Provides only the current warm-start arrays and termination diagnostics consumed by planners; no preparation cache, iterations counter or body data enters the public state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves the existing optional diagnostics for manually supplied warm starts and uses a closed termination union; unfinished and infeasible states do not claim a minimiser.
   * @evidence contracts/development/common.md#meaningful-documentation States unscaled units, ordered-row compatibility, array ownership, optional manual-warm diagnostics and the meaning of each termination status.
   */
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Transfers the unscaled Lagrange multiplier attached to each constraint key, the existing SQP warm-start correspondence; callers supply the state of this ordered problem.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass extracts keyed rows from the solved state, leaving numeric preparation and later convexification with their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads actual solved multipliers; a repeated key keeps its last row by Map semantics and no action-specific mapping is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(m) time and at most one Map entry per distinct key, where m is the row count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Supplies the current multipliers for matching constraints in another convexification; it rebuilds the map because the latest solve may change every multiplier.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates one caller-owned map per extraction and retains no state in the module.
   * @evidence contracts/development/common.md#meaningful-documentation Names the keyed SQP transfer, compatible-state premise, result ownership and repeated-key behavior.
   */
  export function multipliers(
    problem: IProblem,
    state: IState,
  ): Map<string, number> {
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
   * @returns The unscaled iterates and termination status; `x` is a minimiser only when solved or polished.
   * @throws {RangeError} For malformed or nonfinite input, noninvertible scaling, or nonfinite numerical results.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Implements the cited OSQP scaled ADMM equations, unscaled residual and infeasibility tests, adaptive rho and active-set polishing for caller-supplied convex P; termination status distinguishes a residual solution from an unfinished iterate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns admitted numeric equivalence, Band owns linear algebra, and this function owns fresh iterates, prox steps, termination and unscaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves existing rho, sigma, relaxation, iteration and residual parameters; no motion-specific branch or relaxed physical requirement is introduced, and the existing Cholesky diagonal guard remains documented by Band.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each ADMM iteration takes O(n*w+Z+m), with at most 4000 iterations; preparation additionally scans original storage, while reused initial factors, adaptive refactors and polishing have their separately documented S-aware costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares exactly matched preparation and the initial factor for identical rho/sigma; each ADMM row product feeds its prox directly, disposable rhs/xt/before storage is reused after consumption, and soft thresholds are recomputed whenever rho changes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Call-owned x/z/y are unscaled in place only after their final solver use and transferred to the caller, independently of scratch, warm inputs and cached data; one row-sized threshold array avoids repeated divisions and preparation separately retains one numeric core and initial factor per live curvature array.
   * @evidence contracts/development/common.md#meaningful-documentation Describes all OSQP stages, warm and keyed-dual inputs, convergence limits, rejection conditions, mutable output ownership and the preparation lifetime.
   */
  export function solve(
    problem: IProblem,
    warm?: IState,
    duals?: ReadonlyMap<string, number>,
  ): IState {
    const s: B.IScaled = Preparation.scaled(problem);
    const { n, m, start, cols, vals, lo, hi, weight, d, e }: B.IScaled = s;
    const c: number = s.c;
    // Each row's step size: an equality row's a thousand times the step, a
    // row bounded on neither side the least (section 5.2).
    let base: number = RHO0;
    const rho: Float64Array = new Float64Array(m);
    const thresholds: Float64Array = new Float64Array(m);
    const steps: () => void = (): void => {
      for (let r: number = 0; r < m; ++r) {
        rho[r] =
          lo[r] === -Infinity && hi[r] === Infinity
            ? RHO_MIN
            : lo[r] === hi[r]
              ? EQUALITY * base
              : base;
        thresholds[r] = weight[r]! < 0 ? 0 : weight[r]! / rho[r]!;
      }
    };
    steps();
    let factor: Float64Array[] = Preparation.factor(problem, s, rho, SIGMA);

    // The iterates in the scaled problem: x̄ = D⁻¹x, z̄ = E z, ȳ = c E⁻¹ y.
    const x: Float64Array = new Float64Array(n);
    const z: Float64Array = new Float64Array(m);
    const y: Float64Array = new Float64Array(m);
    if (warm !== undefined) {
      if (
        warm.x.length !== n ||
        warm.z.length !== m ||
        warm.y.length !== m ||
        warm.x.some((v: number): boolean => !Number.isFinite(v)) ||
        warm.z.some((v: number): boolean => !Number.isFinite(v)) ||
        warm.y.some((v: number): boolean => !Number.isFinite(v))
      )
        throw new RangeError("Malformed quadratic warm start");
      for (let i: number = 0; i < n; ++i) x[i] = warm.x[i]! / d[i]!;
      for (let r: number = 0; r < m; ++r) {
        z[r] = warm.z[r]! * e[r]!;
        y[r] = (c * warm.y[r]!) / e[r]!;
      }
    } else
      problem.rows.forEach((row: IRow, r: number): void => {
        // A solve of new rows starts from the multipliers of the rows they
        // linearise again (`IRow.key`), the primal at the iterate itself.
        const known: number | undefined =
          row.key === undefined || duals === undefined
            ? undefined
            : duals.get(row.key);
        if (known !== undefined) {
          if (!Number.isFinite(known))
            throw new RangeError(
              `Quadratic row ${r} multiplier must be finite`,
            );
          y[r] = (c * known) / e[r]!;
        }
        z[r] = Math.min(hi[r]!, Math.max(lo[r]!, 0));
      });

    const rhs: Float64Array = new Float64Array(n);
    const xt: Float64Array = new Float64Array(n);
    const before: Float64Array = new Float64Array(m);
    const work: Workspace.IWork = Workspace.of(rhs, xt, before);
    let status: IState["status"] = "unfinished";
    const residual: { primal: number; dual: number } = {
      primal: Infinity,
      dual: Infinity,
    };
    for (let it: number = 0; it < ITERATIONS; ++it) {
      // The ADMM step (algorithm 1), in the reduced form.
      for (let i: number = 0; i < n; ++i) rhs[i] = SIGMA * x[i]! - s.q[i]!;
      for (let r: number = 0; r < m; ++r) {
        const w: number = rho[r]! * z[r]! - y[r]!;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a)
          rhs[cols[a]!]! += vals[a]! * w;
      }
      B.substitute(factor, n, s.band, rhs, xt);
      for (let i: number = 0; i < n; ++i)
        x[i] = ALPHA * xt[i]! + (1 - ALPHA) * x[i]!;

      // x does not enter these row products or prox steps; consume each
      // unchanged xt product directly instead of storing a separate vector.
      for (let r: number = 0; r < m; ++r) {
        let product: number = 0;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a)
          product += vals[a]! * xt[cols[a]!]!;
        before[r] = y[r]!;
        const relaxed: number = ALPHA * product + (1 - ALPHA) * z[r]!;
        const v: number = relaxed + y[r]! / rho[r]!;
        const l: number = lo[r]!;
        const u: number = hi[r]!;
        let next: number;
        if (weight[r]! < 0) next = Math.min(u, Math.max(l, v));
        else {
          const t: number = thresholds[r]!;
          next =
            v > u + t ? v - t : v > u ? u : v < l - t ? v + t : v < l ? l : v;
        }
        y[r] = y[r]! + rho[r]! * (relaxed - next);
        z[r] = next;
      }
      if ((it + 1) % CHECK !== 0 && it + 1 < ITERATIONS) continue;

      // Termination on the unscaled residuals (section 3.4).
      const at: B.IResiduals = B.residuals(s, x, z, y, work);
      if (
        !Number.isFinite(at.primal) ||
        !Number.isFinite(at.primalScale) ||
        !Number.isFinite(at.dual) ||
        !Number.isFinite(at.dualScale) ||
        !Number.isFinite(at.scaledPrimal) ||
        !Number.isFinite(at.scaledPrimalScale) ||
        !Number.isFinite(at.scaledDual) ||
        !Number.isFinite(at.scaledDualScale)
      )
        throw new RangeError(
          "Quadratic iteration produced a nonfinite residual",
        );
      residual.primal = at.primal;
      residual.dual = at.dual;
      if (
        at.primal <= ABSOLUTE + RELATIVE * at.primalScale &&
        at.dual <= ABSOLUTE + RELATIVE * at.dualScale
      ) {
        status = "solved";
        break;
      }
      // A certificate of primal infeasibility of the hard rows (section 3.4).
      if (B.infeasible(s, y, before, INFEASIBLE, work)) {
        status = "infeasible";
        break;
      }
      // The step size balancing the scaled residuals (section 5.2).
      const ratio: number = Math.sqrt(
        at.scaledPrimal /
          Math.max(1e-12, at.scaledPrimalScale) /
          Math.max(1e-12, at.scaledDual / Math.max(1e-12, at.scaledDualScale)),
      );
      const next: number = Math.min(RHO_MAX, Math.max(RHO_MIN, base * ratio));
      if (next > ADAPT * base || next < base / ADAPT) {
        base = next;
        steps();
        factor = B.factor(s, rho, SIGMA, work);
      }
    }

    // Polishing on the active set (section 4).
    if (status === "solved") {
      const polished: ReturnType<typeof B.polish> | undefined =
        B.polish(s, z, y, DELTA, REFINE, work);
      if (polished !== undefined) {
        const at: B.IResiduals = B.residuals(
          s,
          polished.x,
          polished.z,
          polished.y,
          work,
          polished.products,
        );
        const primalOk: boolean =
          Number.isFinite(at.primal) &&
          Number.isFinite(at.primalScale) &&
          (at.primal <= residual.primal ||
            at.primal <= ABSOLUTE + RELATIVE * at.primalScale);
        const dualOk: boolean =
          Number.isFinite(at.dual) &&
          Number.isFinite(at.dualScale) &&
          (at.dual <= residual.dual ||
            at.dual <= ABSOLUTE + RELATIVE * at.dualScale);
        if (primalOk && dualOk) {
          x.set(polished.x);
          z.set(polished.z);
          y.set(polished.y);
          residual.primal = at.primal;
          residual.dual = at.dual;
          status = "polished";
        }
      }
    }

    // Transfer the call-owned iterates after their final scaled use:
    // x = D x̄, z = E⁻¹ z̄, y = E ȳ / c.
    const out: IState = {
      x,
      z,
      y,
      status,
      residual,
    };
    for (let i: number = 0; i < n; ++i) out.x[i] = d[i]! * x[i]!;
    for (let r: number = 0; r < m; ++r) {
      out.z[r] = z[r]! / e[r]!;
      out.y[r] = (e[r]! * y[r]!) / c;
    }
    if (
      out.x.some((v: number): boolean => !Number.isFinite(v)) ||
      out.z.some((v: number): boolean => !Number.isFinite(v)) ||
      out.y.some((v: number): boolean => !Number.isFinite(v))
    )
      throw new RangeError("Quadratic unscaling produced a nonfinite iterate");
    return out;
  }

  /**
   * The value of `½ xᵀPx + qᵀx` plus each soft row's penalty: a trust
   * region's model of the merit.
   *
   * @param problem The problem.
   * @param x The variables.
   * @returns The value.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the symmetric banded quadratic objective and each soft interval's exact l1 distance; callers supply compatible admitted problem data and a finite variable vector.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads curvature, linear cost and soft rows directly, so the trust-region model uses the same problem representation as solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ordered duplicate row contributions and all coefficients; hard rows add no objective penalty by definition, and this reader performs no admission or overflow certification.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n*w plus the supplied entries of soft rows) time and O(1) auxiliary storage; padding outside the in-range curvature band is not read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Evaluates the caller's current x and mutable problem data directly; values are not reused across different trial steps.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses scalar accumulators and retains no data after returning the objective value.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the quadratic and soft-penalty expression, its role in trust-region merit and the compatible-input premise.
   */
  export function value(problem: IProblem, x: Float64Array): number {
    let v: number = 0;
    for (let i: number = 0; i < problem.n; ++i) {
      v += problem.q[i]! * x[i]!;
      v += 0.5 * problem.p[i]![0]! * x[i]! * x[i]!;
      for (let j: number = 1; j <= problem.band && i + j < problem.n; ++j)
        v += problem.p[i]![j]! * x[i]! * x[i + j]!;
    }
    for (const row of problem.rows) {
      if (row.weight === undefined) continue;
      let s: number = 0;
      for (let a: number = 0; a < row.index.length; ++a)
        s += row.coef[a]! * x[row.index[a]!]!;
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
const RELATIVE: number = HumanQuadraticProgram.TOLERANCE;

/** The primal infeasibility certificate's tolerance (OSQP's default). */
const INFEASIBLE: number = 1e-4;

/** The polishing system's regularisation (OSQP's δ). */
const DELTA: number = 1e-6;

/** Iterative refinement steps of the polishing solve (OSQP's default). */
const REFINE: number = 3;
