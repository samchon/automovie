/**
 * Exact rational production frame rate in frames per second; canonical
 * consumers reduce the fraction by its greatest common divisor.
 */
export interface IAutoMovieProductionFrameRate {
  /** Positive safe-integer frame-rate numerator. */
  numerator: number;

  /** Positive safe-integer frame-rate denominator. */
  denominator: number;
}
