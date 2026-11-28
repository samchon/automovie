/**
 * Physical curve-length observation from coarse and doubled-resolution
 * quadrature.
 *
 * View-section, cubic and arbitrary-piece readers return the finer integral and
 * its absolute difference from the coarser one, both in millimetres. The
 * difference is a numerical observation. Both rules can miss narrow features
 * and piece errors can cancel. The returned record owns two scalars.
 */
export type IAutoMovieCurveLengthMeasurement64 = {
  /** K*2-panel integral of original physical speed, mm. */
  lengthMm: number;
  /** Absolute K/K*2 difference, mm; not a bound. */
  differenceMm: number;
};
