/**
 * Original-coordinate stopping criteria and finite work for QP correction.
 * Numerical convergence does not establish the consuming geometry's validity.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps caller-owned original residual precision separate from correction work.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Requires original-row KKT checks without changing geometric tolerances or constraints.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementOptions {
  /** Positive finite threshold for original feasibility, stationarity and complementarity. */
  tolerance: number;

  /** Nonnegative safe integer bounding original-coordinate polishing corrections. */
  maximumRefinements: number;
}
