/** Type contracts exchanged by AutoMovieHumanMonotoneCubic; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanMonotoneCubic {
  /** The knots argument of AutoMovieHumanMonotoneCubic.interpolate. Value at x.
  @param knots `[x, y]` pairs in any order, at least one.
  @param x Abscissa.
  @param merge Least abscissa spacing kept between knots; 0 keeps all.
  @returns The interpolated value.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Value at x.
 * @evidence contracts/development/design.md#principled-representation Value at x. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanMonotoneCubic.InterpolateKnots is the canonical exchange used by AutoMovieHumanMonotoneCubic.interpolate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanMonotoneCubic.interpolate for value at x.
 */
  export type InterpolateKnots = readonly (readonly [number, number])[];
}
