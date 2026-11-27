import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticInterior } from "./HumanQuadraticInterior";
import type { HumanQuadraticInteriorSession } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticModel } from "./HumanQuadraticModel";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticSolve } from "./HumanQuadraticSolve";
import { HumanQuadraticValue } from "./HumanQuadraticValue";

/*
 * A convex quadratic program with banded curvature and sparse rows, solved by
 * OSQP (Stellato, Banjac, Goulart, Bemporad and Boyd 2020, "OSQP: an operator
 * splitting solver for quadratic programs", Math Program Comput 12:637):
 * minimise `1/2 x^T P x + q^T x` over rows `l <= a.x <= u`, each row hard
 * (projected onto its interval) or soft (an exact l1 penalty `weight` times its
 * distance from the interval, whose proximal step is a soft threshold toward
 * it), the form of the convex subproblem of TrajOpt's sequential convex
 * optimisation (Schulman et al. 2014, IJRR 33:1251).
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
 * so every linear system is the banded reduced form `P + sigma I + A^T
 * diag(rho) A` (the paper's indirect form), factored by a banded Cholesky
 * factorisation (`HumanQuadraticBand`). A warm start carries the iterates of a
 * solve of the same rows with other bounds. A one-shot `solve` prepares its own
 * data; a caller that keeps a preparation (an interior session, a fixed model)
 * shares it only after exact P, q, ordered nonzero A and scaling comparisons
 * (`HumanQuadraticPreparation`). prepare additionally snapshots a fixed
 * convexification for bound-only retries and bounded exact factor and scratch
 * reuse; each solve computes its own iterates and resets rho. Costs use
 * w=band+1, S supplied curvature entries, Z stored row entries and m rows,
 * including diagonal systems and supplied curvature padding.
 */
export namespace HumanQuadraticProgram {
  /*
   * Relative residual tolerance, OSQP's eps_rel; it does not bound each
   * variable's error independently of conditioning.
   *
   * Names the inherited relative residual tolerance and distinguishes residual
   * convergence from a componentwise solution-error guarantee.
   */
  export const TOLERANCE: number = 1e-3;

  /*
   * A solve's multipliers by its rows' keys, for the next convexification to
   * start from.
   * Parameter problem: The problem solved.
   * Parameter state: Its solve's iterates.
   * Returns: Each keyed row's multiplier.
   */
  export function multipliers(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    state: IAutoMovieMotionHumanQuadraticProgram.IState,
  ): Map<string, number> {
    const out: Map<string, number> = new Map();
    problem.rows.forEach(
      (row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
        if (row.key !== undefined) out.set(row.key, state.y[r]!);
      },
    );
    return out;
  }

  /*
   * The minimiser.
   * Parameter problem: The problem; its numeric storage remains unchanged during
   * this synchronous solve.
   * Parameter warm: The iterates of a solve of the same rows; zero when absent.
   * Parameter duals: Multipliers by row key from a solve of other rows that
   * linearise the same constraints, read when `warm` is absent.
   * Returns: The unscaled iterates and termination status; `x` is a minimiser
   * only when solved or polished.
   * For malformed or nonfinite input, noninvertible
   * scaling, or nonfinite numerical results.
   */
  export function solve(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
    duals?: ReadonlyMap<string, number>,
  ): IAutoMovieMotionHumanQuadraticProgram.IState {
    return HumanQuadraticSolve(
      problem.rows,
      Preparation.scaled(problem),
      TOLERANCE,
      warm,
      duals,
    );
  }

  /*
   * Prepare one fixed numeric convexification for solves with other intervals.
   * The model snapshots P, q and all ordered row coefficients; changing them
   * requires a new model, while each solve receives its current row bounds.
   * Parameter problem: Finite convex banded data, unchanged while preparation
   * admits and snapshots it.
   * Returns: A model owning preparation, exact factors and reusable scratch.
   * For the same malformed data or scaling failures as
   * solve.
   */
  export function prepare(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  ): HumanQuadraticModel.IModel {
    return HumanQuadraticModel(problem, TOLERANCE);
  }

  /*
   * The minimiser by the interior-point method (`HumanQuadraticInterior`), for
   * a caller whose curvature is badly conditioned for the operator splitting of
   * `solve`: a second-order method's iteration count does not grow with that
   * conditioning.
   * Parameter problem: The problem; its numeric storage remains unchanged during
   * this synchronous solve.
   * Parameter session: The caller's session of solves of one optimisation
   * (`HumanQuadraticInteriorSession.ISession`): its first solve's scales
   * serve the later ones, a solve of the same rows starts from the one
   * before, and the solver's scratch is kept between them; absent, the solve
   * is alone and cold.
   * Returns: The unscaled iterates with status `solved`, to the interior
   * method's own accuracy; undefined when it did not converge, and the caller
   * solves by `solve` or a prepared model.
   * For malformed or nonfinite input or noninvertible
   * scaling, as `solve` throws.
   */
  export function interior(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    session?: HumanQuadraticInteriorSession.ISession,
  ): IAutoMovieMotionHumanQuadraticProgram.IState | undefined {
    return HumanQuadraticInterior(problem, session);
  }

  /*
   * The value of `1/2 x^T P x + q^T x` plus each soft row's penalty: a trust
   * region's model of the merit.
   * Parameter problem: The problem.
   * Parameter x: Finite current variables, or the exact zero origin when absent;
   * problem data must already be admitted finite.
   * Parameter observe: Optional synchronous read-only consumer of each soft row's
   * actual interval excess in row order; it must not mutate problem or x.
   * Returns: The value.
   */
  export function value(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    x?: Float64Array,
    observe?: (
      row: IAutoMovieMotionHumanQuadraticProgram.IRow,
      miss: number,
    ) => void,
  ): number {
    return HumanQuadraticValue(problem, x, observe);
  }
}
