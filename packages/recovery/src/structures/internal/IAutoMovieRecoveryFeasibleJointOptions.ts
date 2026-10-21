import type { IAutoMovieSimplexBudget } from "@automovie/engine/math/IAutoMovieSimplexBudget";

/**
 * Explicit opt-in resource limits for the experimental feasible joint method.
 * Internal scene routing snapshots these fields before callbacks, bounds them
 * by original scene ceilings and resets numerical seeds in every closure fit.
 *
 * @evidence contracts/common.md#principled-implementation The same fixed population and geometric thresholds receive additional admitted direction-work and simultaneous-retention bounds, without changing outer nonlinear trial limits.
 * @evidence contracts/common.md#clear-and-simple-design Internal method selection keeps the ordinary public map/scene behavior unchanged while the bounded method receives principled analytic and transaction evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Limits are fixed before fitting; no specimen, rejected observation or expected pose is carried by this option.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish per-direction sparse work from total owner charging and logical simultaneous retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input performs no fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar ceilings acquire no resource.
 */
export interface IAutoMovieRecoveryFeasibleJointOptions {
  /** Per-direction pairwise iteration, input-plus-scratch scalar and visit ceilings. */
  directionBudget: IAutoMovieSimplexBudget;

  /** Maximum simultaneous logical joint/model/direction scalars, excluding JS overhead and images. */
  maxResidentLinearEntries: number;

  /** Select SQP mixing/curvature and same-base qualified full/half cost comparison; original KKT and the actual trial horizon still apply. */
  sqpAcceleration?: boolean;

  /** Independently select fit-local accepted-agreement damping, starting at 1e-3 and changing only the next existing model; false or absent retains fixed damping. */
  adaptiveRegularization?: boolean;

  /** Select a separately admitted lagged fixed-untilted-dual local curvature metric after the first GN model; true requires sqpAcceleration. Absence preserves the current metric policy. */
  laggedLagrangianMetric?: boolean;
}
