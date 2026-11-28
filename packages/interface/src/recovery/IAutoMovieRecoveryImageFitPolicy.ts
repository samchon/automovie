/**
 * Choose aligned elliptical X/Z sections and bound the fit of their
 * longitudinal cubic profiles to silhouettes from supplied orthographic
 * cameras. Recovery reports refusal when the observation, direction design, or
 * coefficient fit cannot meet these limits.
 */

export interface IAutoMovieRecoveryImageFitPolicy {
  /**
   * Select ellipses whose horizontal axes align with the supplied frame X and
   * Z.
   */
  family: "aligned-elliptical-sections";

  /**
   * Positive safe integer cap on supplied views. The fitter requires at least
   * three views.
   */
  maxViews: number;

  /**
   * Positive safe integer cap on the sum of observed rows across all views,
   * before selecting the common physical domain.
   */
  maxRows: number;

  /**
   * Positive safe integer cap on candidate longitudinal cubic spans. A
   * candidate with N spans needs at least N + 3 common stations.
   */
  maxSpans: number;

  /**
   * Positive finite limit on absolute silhouette edge residuals, evaluated in
   * each original view's pixels both per section and after fitting the
   * longitudinal profile.
   */
  maximumResidualPx: number;

  /**
   * Finite threshold strictly between zero and one. Both singular value ratios
   * must meet it, and distinct squared X components must differ by more than
   * it.
   */
  minimumDirectionRatio: number;

  /**
   * Finite threshold strictly between zero and one for the smallest-to-largest
   * magnitude of the spline QR diagonal.
   */
  minimumSplineRatio: number;
}
