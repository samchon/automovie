/**
 * Physical curve-length observation from coarse and doubled-resolution
 * quadrature.
 *
 * The view-section, cubic-curve and arbitrary-piece length readers return the
 * finer integral and its difference from the coarse integral in millimetres.
 * This difference is observed convergence, not an error bound: narrow features
 * may escape both rules and piece errors may cancel. Each producer owns source
 * admission, including whether it reads endpoints. No callback or source data
 * is retained by this newly allocated mutable result.
 */
export type IAutoMovieCurveLengthMeasurement64 = {
  /** K*2-panel integral of original physical speed, mm. */
  lengthMm: number;
  /** Absolute K/K*2 difference, mm; not a bound. */
  differenceMm: number;
};
