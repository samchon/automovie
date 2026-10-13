/**
 * One sparse affine interval. Indices are unique variable ordinals; weights
 * have the same length. A null endpoint is unbounded. Empty rows are constant
 * zero constraints, which may make the problem infeasible.
 *
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
