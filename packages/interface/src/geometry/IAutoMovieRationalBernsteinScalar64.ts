/**
 * Scalar quotient represented by homogeneous Bernstein numerator and
 * denominator coefficients on one parameter chart.
 *
 * Numerator, denominator and queried derivative arithmetic need representable
 * intermediate products in the chosen homogeneous scale.
 */
export interface IAutoMovieRationalBernsteinScalar64 {
  /**
   * Mutable scalar numerator coefficients in Bernstein order. Keep the
   * evaluated division and any needed derivative products representable.
   */
  numerator: number[];

  /**
   * Mutable scalar denominator coefficients on the numerator's parameter chart.
   * Supply a positive finite evaluated denominator.
   */
  denominator: number[];
}
