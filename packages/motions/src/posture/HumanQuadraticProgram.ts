import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticInterior } from "./HumanQuadraticInterior";
import type { HumanQuadraticInteriorSession } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticModel } from "./HumanQuadraticModel";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticSolve } from "./HumanQuadraticSolve";
import { HumanQuadraticValue } from "./HumanQuadraticValue";

/**
 * A convex quadratic program with banded curvature and sparse rows, solved
 * by OSQP (Stellato, Banjac, Goulart, Bemporad and Boyd 2020, "OSQP: an
 * operator splitting solver for quadratic programs", Math Program Comput
 * 12:637): minimise `1/2 x^T P x + q^T x` over rows `l <= a.x <= u`, each row hard
 * (projected onto its interval) or soft (an exact l1 penalty `weight` times its
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
 * other, so every linear system is the banded reduced form `P + sigma I + A^T
 * diag(rho) A` (the paper's indirect form), factored by a banded Cholesky
 * factorisation (`HumanQuadraticBand`). A warm start carries the iterates of
 * a solve of the same rows with other bounds. `HumanQuadraticPreparation`
 * shares complete numeric preparation only after exact P, q and ordered
 * nonzero A comparisons. Exactly equal finished scaled P/A pairs can share
 * their initial factor independently of the current q and unit scales.
 * prepare additionally snapshots
 * a fixed convexification for bound-only retries and bounded exact factor
 * and scratch reuse; each solve computes its own iterates and resets rho.
 * Costs use w=band+1, S supplied curvature entries, Z stored row entries
 * and m rows, including diagonal systems and supplied curvature padding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the convex objective, hard and soft rows, OSQP stages, band representation, warm iterates and exact numeric preparation sharing.
 * @evidence contracts/development/design.md#principled-representation Groups the convex program, ordered sparse rows and unscaled primal-dual state; their interfaces state numeric and dimensional premises while runtime admission checks finite structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the solver, fixed-matrix preparation, objective and keyed multipliers used by motion planners; matrix admission and banded algebra remain internal modules.
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
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    state: IAutoMovieMotionHumanQuadraticProgram.IState,
  ): Map<string, number> {
    const out: Map<string, number> = new Map();
    problem.rows.forEach((row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
      if (row.key !== undefined) out.set(row.key, state.y[r]!);
    });
    return out;
  }

  /**
   * The minimiser.
   *
   * @param problem The problem; its numeric storage remains unchanged during this synchronous solve.
   * @param warm The iterates of a solve of the same rows; zero when absent.
   * @param duals Multipliers by row key from a solve of other rows that linearise the same constraints, read when `warm` is absent.
   * @returns The unscaled iterates and termination status; `x` is a minimiser only when solved or polished.
   * @throws {RangeError} For malformed or nonfinite input, noninvertible scaling, or nonfinite numerical results.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Implements the cited OSQP scaled ADMM equations, unscaled residual and infeasibility tests, adaptive rho and active-set polishing for caller-supplied convex P; termination status distinguishes a residual solution from an unfinished iterate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns admitted numeric equivalence, Band owns linear algebra, and the shared HumanQuadraticSolve owns independent iterates, prox steps, termination and unscaling for this one-shot entry and prepared models.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves existing rho, sigma, relaxation, iteration and residual parameters. Nonfinite operands restore original zero terms instead of concealing IEEE-754 failures or rejecting truly empty rows; admitted inputs remain unchanged during the synchronous solve, and Band documents the unchanged diagonal guard.
   * @evidence contracts/development/implementation.md#efficient-algorithms Finite ADMM iterations take O(n*w+Z+m), with at most 4000 iterations; exceptional products may revisit R original row entries. Preparation scans original storage, while initial factors, adaptive refactors and polishing have their documented S-aware costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares exactly matched full preparation or finished scaled P/A factor dependencies. Original-order topology positions serve current rhs contributions, each row product feeds its prox, consumed rhs/xt/before supply scratch and rho changes recompute thresholds/products. Accepted polish iterates transfer without copying; each unscale producer checks its final value before the original rejection phase.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Selected ADMM or accepted-polish iterates transfer independently of scratch/warm/cache data after unscaling. Thresholds, borrowed raw rows and at most R restored exceptional coefficients release with this solve, as do rejected polish data. Preparation retains one numeric core per live source curvature array and one initial factor per live immutable scaled P/A pair, never original row loans.
   * @evidence contracts/development/common.md#meaningful-documentation Describes all OSQP stages, warm and keyed-dual inputs, convergence limits, rejection conditions, mutable output ownership and the preparation lifetime.
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

  /**
   * Prepare one fixed numeric convexification for solves with other intervals.
   * The model snapshots P, q and all ordered row coefficients; changing them
   * requires a new model, while each solve receives its current row bounds.
   *
   * @param problem Finite convex banded data, unchanged while preparation admits and snapshots it.
   * @returns A model owning preparation, exact factors and reusable scratch.
   * @throws {RangeError} For the same malformed data or scaling failures as solve.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates admission and modified Ruiz equilibration to the same numeric owner as one-shot solve; a copied fixed matrix defines the model while intervals remain solve inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Exposes the fixed-matrix producer through the existing quadratic namespace and delegates its state and lifetime to HumanQuadraticModel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Snapshots generic numeric data without trusting mutable input identity, changing solver tolerances or retaining an answer; every call still runs OSQP on its supplied bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation takes its documented O(S+R+10*(n*w+Z+m)) miss cost or exact-match scan, then O(R+m) copying for original zero preservation and O(n+m) scratch allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed P/q/A and row order are immutable owned dependencies; the consumer supplies only current intervals, weights and keys, and rebuilds this model for a new convexification.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned model retaining its scaled matrices, copied original rows, O(n+m) scratch and at most three workspace factor owners plus its initial factor, each with upper/forward layouts; outputs and warm iterates remain independent and only discarded candidates may supply reset scratch.
   * @evidence contracts/development/common.md#meaningful-documentation States snapshot semantics, model invalidation, changing inputs, preparation failure and ownership.
   */
  export function prepare(problem: IAutoMovieMotionHumanQuadraticProgram.IProblem): HumanQuadraticModel.IModel {
    return HumanQuadraticModel.of(problem, TOLERANCE);
  }

  /**
   * The minimiser by the interior-point method (`HumanQuadraticInterior`),
   * for a caller whose curvature is badly conditioned for the operator
   * splitting of `solve`: a second-order method's iteration count does not
   * grow with that conditioning.
   *
   * @param problem The problem; its numeric storage remains unchanged during this synchronous solve.
   * @param session The caller's session of solves of one optimisation (`HumanQuadraticInteriorSession.ISession`): its first solve's scales serve the later ones, a solve of the same rows starts from the one before, and the solver's scratch is kept between them; absent, the solve is alone and cold.
   * @returns The unscaled iterates with status `solved`, to the interior method's own accuracy; undefined when it did not converge, and the caller solves by `solve` or a prepared model.
   * @throws {RangeError} For malformed or nonfinite input or noninvertible scaling, as `solve` throws.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the primal-dual predictor-corrector iteration documented with its derivation at `HumanQuadraticInterior`, on the same admitted and equilibrated data as `solve`, or on the session's scales.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation; the method, its parameters, its session and its failure cases have one owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solve that misses its accuracy returns nothing instead of an approximate iterate; no row or penalty differs from `solve`'s reading of the problem.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n w^2) an iteration for n variables and band w, a bounded number of iterations; no speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the numeric preparation of `solve` for exactly equal data, and with a session its scales, scratch and last point as `HumanQuadraticInterior` states.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Without a session all scratch is released on return; a session keeps what `HumanQuadraticInteriorSession.ISession` states until its caller drops it; the returned arrays are the caller's.
   * @evidence contracts/development/common.md#meaningful-documentation States when to use it, the session, the absent result's meaning and the failure cases.
   */
  export function interior(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    session?: HumanQuadraticInteriorSession.ISession,
  ): IAutoMovieMotionHumanQuadraticProgram.IState | undefined {
    return HumanQuadraticInterior(problem, session);
  }

  /**
   * The value of `1/2 x^T P x + q^T x` plus each soft row's penalty: a trust
   * region's model of the merit.
   *
   * @param problem The problem.
   * @param x Finite current variables, or the exact zero origin when absent; problem data must already be admitted finite.
   * @param observe Optional synchronous read-only consumer of each soft row's actual interval excess in row order; it must not mutate problem or x.
   * @returns The value.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the symmetric banded quadratic objective and each soft interval's exact l1 distance; callers supply compatible admitted finite data and current finite variables, with finite-coefficient zero products known exactly at the absent-vector origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates current-x and admitted-origin calculations to HumanQuadraticValue, sharing each computed interval excess with an optional same-call model diagnostic consumer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original nonzero/duplicate contribution order and every scalar association. Same-call finite x permits exact-zero omission; nonfinite x retains the full original product path. Hard rows add no objective penalty by definition, and this reader performs no admission or overflow certification.
   * @evidence contracts/development/implementation.md#efficient-algorithms Current-x evaluation takes O(n*w+R+m), including finite-x proof, for R supplied soft entries and m rows; finite x skips exact-zero off-diagonal/row multiplications. Origin costs O(m), with O(1) auxiliary storage and no zero vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads current mutable data, sharing each row product/excess with its synchronous observer and xi/P rows within current curvature evaluation. One finite-x proof permits zero-product omission; origin products are already proved zero by admission, and no values survive across trials.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Uses scalar accumulators and retains no data after returning the objective value.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the quadratic and soft-penalty expression, admitted-origin mode, ordered read-only observer and compatible finite-input premise.
   */
  export function value(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    x?: Float64Array,
    observe?: (row: IAutoMovieMotionHumanQuadraticProgram.IRow, miss: number) => void,
  ): number {
    return HumanQuadraticValue(problem, x, observe);
  }
}



