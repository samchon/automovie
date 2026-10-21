/**
 * Sparse vector and affine coefficient of a simplex quadratic objective.
 *
 * @evidence contracts/common.md#principled-implementation The atom contributes lambda*a to the Euclidean aggregate and lambda*offset to the affine objective, with nonnegative simplex weights.
 * @evidence contracts/common.md#clear-and-simple-design Sparse coefficients keep a generic convex problem separate from recovery residuals and gauge coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sorted unique indices give each authored coordinate exactly one coefficient; no implicit regularization or omitted constraint is represented.
 * @evidence contracts/common.md#meaningful-documentation Members define sparse ordering, finite coefficients and the affine term's objective units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input performs no minimization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns arrays borrowed synchronously by the minimizer, without mutation or retained handles.
 */
export interface IAutoMovieSimplexAtom {
  /** Strictly increasing safe-integer coordinates within the declared width. */
  indices: readonly number[];

  /** Finite coefficients corresponding to indices, including authored zeros. */
  values: readonly number[];

  /** Finite affine objective coefficient, without a positivity requirement. */
  offset: number;
}
