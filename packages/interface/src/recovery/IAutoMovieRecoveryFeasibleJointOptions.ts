import type { IAutoMovieSimplexBudget } from "..";

/**
 * Explicit opt-in resource limits for the experimental feasible joint method.
 * Internal scene routing snapshots these fields before callbacks, bounds them
 * by original scene ceilings and resets numerical seeds in every closure fit.
 */
export interface IAutoMovieRecoveryFeasibleJointOptions {
  /**
   * Per-direction pairwise iteration, input-plus-scratch scalar and visit
   * ceilings.
   */
  directionBudget: IAutoMovieSimplexBudget;

  /**
   * Maximum simultaneous logical joint/model/direction scalars, excluding JS
   * overhead and images.
   */
  maxResidentLinearEntries: number;

  /**
   * Select SQP mixing/curvature and same-base qualified full/half cost
   * comparison; original KKT and the actual trial horizon still apply.
   */
  sqpAcceleration?: boolean;

  /**
   * Independently select fit-local accepted-agreement damping, starting at 1e-3
   * and changing only the next existing model; false or absent retains fixed
   * damping.
   */
  adaptiveRegularization?: boolean;

  /**
   * Select a separately admitted lagged fixed-untilted-dual local curvature
   * metric after the first GN model; true requires sqpAcceleration. Absence
   * preserves the current metric policy.
   */
  laggedLagrangianMetric?: boolean;
}
