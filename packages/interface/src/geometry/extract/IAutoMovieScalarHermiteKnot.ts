/**
 * One knot of a reduced run: station, value and slope.
 *
 * @evidence contracts/development/design.md#principled-representation A cubic Hermite knot; consecutive knots define one span through hermite.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dense index beside the knot's data lets a caller trace it to its sample and flags.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is the dense sample's own; the slope is fitted.
 * @evidence contracts/development/common.md#meaningful-documentation States which members are measured and which fitted.
 */
export interface IAutoMovieScalarHermiteKnot {
  /** Index of the dense point it sits on, in the caller's array (excluded samples counted). */
  index: number;

  /**
   * Station in the input run's station unit (millimetres for section measurements); retained in original order.
   */
  s: number;

  /**
   * Original dense scalar value in the input value unit; knot removal changes slopes, not this sample.
   */
  value: number;

  /** Slope d value / d station, fitted to the dense samples of its two spans; zero at a prominent extremum. */
  slope: number;
}
