/** One knot of a reduced run: station, value and slope. */
export interface IAutoMovieScalarHermiteKnot {
  /**
   * Index of the dense point it sits on, in the caller's array (excluded
   * samples counted).
   */
  index: number;

  /**
   * Station in the input run's station unit (millimetres for section
   * measurements); retained in original order.
   */
  s: number;

  /**
   * Original dense scalar value in the input value unit; knot removal changes
   * slopes, not this sample.
   */
  value: number;

  /**
   * Slope d value / d station, fitted to the dense samples of its two spans;
   * zero at a prominent extremum.
   */
  slope: number;
}
