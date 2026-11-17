/**
 * Sparse vector and affine coefficient of a simplex quadratic objective.
 *
 * @evidence contracts/development/design.md#principled-representation The atom contributes lambda*a to the Euclidean aggregate and lambda*offset to the affine objective, with nonnegative simplex weights.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Sparse coefficients keep a generic convex problem separate from recovery residuals and gauge coordinates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sorted unique indices give each authored coordinate exactly one coefficient; no implicit regularization or omitted constraint is represented.
 * @evidence contracts/development/common.md#meaningful-documentation Members define sparse ordering, finite coefficients and the affine term's objective units.
 */
export interface IAutoMovieSimplexAtom {
  /** Strictly increasing safe-integer coordinates within the declared width. */
  indices: readonly number[];

  /** Finite coefficients corresponding to indices, including authored zeros. */
  values: readonly number[];

  /** Finite affine objective coefficient, without a positivity requirement. */
  offset: number;
}
