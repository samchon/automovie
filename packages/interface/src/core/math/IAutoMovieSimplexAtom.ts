/** Sparse vector and affine coefficient of a simplex quadratic objective. */
export interface IAutoMovieSimplexAtom {
  /** Strictly increasing safe-integer coordinates within the declared width. */
  indices: readonly number[];

  /** Finite coefficients corresponding to indices, including authored zeros. */
  values: readonly number[];

  /** Finite affine objective coefficient, without a positivity requirement. */
  offset: number;
}
