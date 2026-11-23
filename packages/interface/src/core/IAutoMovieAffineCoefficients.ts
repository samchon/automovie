/**
 * Coefficients of the scalar affine function `a + b * x`.
 *
 * The using field names the predictor and output measure. Human anthropometric
 * regressions, for example, predict millimetre lengths from a named millimetre
 * measurement; other predictors can carry different units. Coefficients do not
 * describe a spatial transform or a multivariate regression.
 *
 * These are caller-owned mutable data. A reader applies the stated formula; it
 * supplies no fitted range, clamping or validation. The coefficient producer
 * and its consuming model own finite values and the predictor's admitted
 * range.
 */
export interface IAutoMovieAffineCoefficients {
  /** Value at zero predictor, in the output measure's units. */
  a: number;

  /** Change in output per unit increase of the predictor. */
  b: number;
}
