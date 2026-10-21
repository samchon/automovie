import type { IAutoMovieRecoveryFeasibleDirectionReport } from "./IAutoMovieRecoveryFeasibleDirectionReport";
import type { IAutoMovieRecoverySqpReport } from "./IAutoMovieRecoverySqpReport";
import type { IAutoMovieRecoveryFeasibleTrials } from "./IAutoMovieRecoveryFeasibleTrials";

/**
 * Last feasible state and explicit normal or incomplete termination.
 *
 * @evidence contracts/common.md#principled-implementation Only a positive-objective-multiplier original-coordinate KKT certificate terminates normally; feasible rejected or budget-limited states remain nonconverged.
 * @evidence contracts/common.md#clear-and-simple-design One report separates actual nonlinear trials, model work and accepted steps from retained state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returning initial or last feasible state is not a fallback success, and no cost/step-small heuristic substitutes for constrained stationarity.
 * @evidence contracts/common.md#meaningful-documentation Defines termination, original-unit residuals and accepted/rejected trial counts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report performs no fitting work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources State and scalars transfer to caller without rejected-state history or external handles.
 */
export interface IAutoMovieRecoveryFeasibleFit<State> {
  /** Last accepted feasible state, unchanged when no trial was accepted. */
  state: State;

  /** True only for normal original-coordinate stationarity with finite certificate. */
  converged: boolean;

  /** Feasibility alone, tiny step or convex budget exhaustion never means KKT. */
  termination:
    | "kkt"
    | "iteration-budget"
    | "direction-incomplete"
    | "abnormal-or-stalled";

  /** All actual nonlinear evaluations, including qualified unselected candidates. */
  iterations: number;

  /** Selected local state updates passing actual feasibility and Armijo; qualified unselected evaluations do not count as updates or convergence. */
  acceptedSteps: number;

  /** Actual cost at the initial feasible state. */
  initialCost: number;

  /** Actual cost at state over the same population. */
  finalCost: number;

  /** Last maximum original-coordinate Lagrangian gradient component; null without stable positive objective multiplier. */
  stationarity: number | null;

  /** Objective-gradient scale of the last physically checked model, not a geometric error tolerance. */
  stationarityScale: number | null;

  /** Last physical model passed the original normal KKT checks; QP qualification is separately required for convergence. */
  normalKktQualified: boolean;

  /** Last maximum absolute original multiplier times nonlinear g; null for abnormal multipliers. */
  complementarity: number | null;

  /** Combined conservative scalar visits in all direction solves and certificates. */
  directionWork: number;

  /** Last baseline pure-QP scalar stop and residuals, distinct from any applied mixture or curvature step. */
  lastDirection: IAutoMovieRecoveryFeasibleDirectionReport | null;

  /** Latest optional working-space/arc evidence, distinct from the baseline QP certificate. */
  lastSqp: IAutoMovieRecoverySqpReport | null;

  /** Fixed-size actual path/failure counts, without geometry or trial history. */
  trials: IAutoMovieRecoveryFeasibleTrials;
}
