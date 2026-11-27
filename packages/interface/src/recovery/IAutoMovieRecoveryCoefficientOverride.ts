/**
 * Numerical data estimate for one replacement saved curve, independent of
 * source-interior fidelity.
 */

export interface IAutoMovieRecoveryCoefficientOverride {
  /** Saved source-free curve identity. */
  curveName: string;

  /**
   * Upper numerical data estimate in millimetres; this is not a source-fit
   * certificate.
   */
  dataUpperEstimateMm: number;
}
