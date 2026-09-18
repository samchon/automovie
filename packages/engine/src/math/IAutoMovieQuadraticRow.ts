/**
 * One sparse affine interval. Indices are unique variable ordinals; weights
 * have the same length. A null endpoint is unbounded. Empty rows are constant
 * zero constraints, which may make the problem infeasible.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Expresses a shared linear displacement condition without attaching it to a particular asset or subject.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains original variable identities, coefficients and both interval bounds for independent residual evaluation.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRow {
  /** Unique zero-based variable indices. */
  indices: readonly number[];
  /** Finite coefficients corresponding to indices, including exact zeros. */
  weights: readonly number[];
  /** Inclusive finite lower endpoint, or null for no lower bound. */
  lower: number | null;
  /** Inclusive finite upper endpoint, or null for no upper bound. */
  upper: number | null;
}
