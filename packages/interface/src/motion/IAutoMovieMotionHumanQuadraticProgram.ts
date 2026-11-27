/**
 * A convex quadratic program with banded curvature and sparse rows, solved by
 * OSQP (Stellato, Banjac, Goulart, Bemporad and Boyd 2020, "OSQP: an operator
 * splitting solver for quadratic programs", Math Program Comput 12:637):
 * minimise `½ xᵀPx + qᵀx` over rows `l <= a·x <= u`, each row hard (projected
 * onto its interval) or soft (an exact l1 penalty `weight ×` its distance from
 * the interval, whose proximal step is a soft threshold toward it), the form of
 * the convex subproblem of TrajOpt's sequential convex optimisation (Schulman
 * et al. 2014, IJRR 33:1251).
 *
 * As the paper prescribes:
 *
 * - The data are equilibrated first (section 5.1): modified Ruiz scaling of the
 *   KKT matrix's columns, the variables by `D`, the rows by `E` and the cost by
 *   `c`, so rows of millimetres and of degrees meet the same step;
 * - Each row has its own step size (section 5.2): an equality row a thousand
 *   times the step, a row bounded on neither side the least;
 * - The step size adapts (section 5.2) to balance the primal and the dual
 *   residuals, the step's system factored again when it changes fivefold;
 * - The iteration stops on the primal and dual residuals of the unscaled problem
 *   (section 3.4), or on a certificate of primal infeasibility (section 3.4),
 *   `ITERATIONS` only a guard;
 * - A solved problem is polished (section 4): the KKT system of the rows the
 *   solution holds on their bounds is solved, regularised and refined, so those
 *   rows are met to numerical precision, and the polished solution is kept when
 *   its residuals are no larger.
 *
 * The curvature and the rows only couple variables within `band` of each other,
 * so every linear system is the banded reduced form `P + σI + Aᵀ diag(ρ) A`
 * (the paper's indirect form), factored by a banded Cholesky factorisation
 * (`HumanQuadraticBand`). A warm start carries the iterates of a solve of the
 * same rows with other bounds.
 */
export namespace IAutoMovieMotionHumanQuadraticProgram {
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
    rows: readonly IAutoMovieMotionHumanQuadraticProgram.IRow[];
  }

  /** A row of the problem, linear in its variables: `l <= Σ coef·x[index] <= u`. */
  export interface IRow {
    /**
     * The constraint the row linearises, so a later solve of the next
     * convexification starts from its multiplier.
     */
    key?: string;
    /**
     * Integer variable indices in [0, n); order and duplicate indices are
     * preserved.
     */
    index: readonly number[];
    /**
     * Finite coefficients, one per index; exact positive and negative zeros are
     * omitted internally.
     */
    coef: readonly number[];
    /** The interval's lower end; `-Infinity` for none. */
    l: number;
    /** The interval's upper end; `Infinity` for none. */
    u: number;
    /** Finite nonnegative l1 penalty weight; absent for a hard row. */
    weight?: number;
  }

  /**
   * A solve's iterates, to warm-start another solve of the same rows, and how
   * the solve ended.
   */
  export interface IState {
    /** The variables. */
    x: Float64Array;
    /**
     * Each row's value as the splitting holds it, inside or penalised toward
     * its interval.
     */
    z: Float64Array;
    /** Each row's multiplier. */
    y: Float64Array;
    /**
     * Why the solve stopped: its residuals met (`solved`, and `polished` when
     * the active set's solve was kept), the hard rows certified infeasible, or
     * the guard reached.
     */
    status?: "solved" | "polished" | "infeasible" | "unfinished";
    /**
     * The unscaled primal and dual residuals the solve ended at, their infinity
     * norms.
     */
    residual?: IStateResidual;
  }

  /** The residual object of {@link IState}. */
  export type IStateResidual = {
    /**
     * Infinity norm of the primal residual of the original unscaled
     * constrained problem.
     */
    primal: number;
    /**
     * Infinity norm of the dual residual of the original unscaled constrained
     * problem.
     */
    dual: number;
  };
}
