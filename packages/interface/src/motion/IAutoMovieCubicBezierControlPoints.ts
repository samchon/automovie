/**
 * Named control points for a cubic Bézier easing curve.
 *
 * The x coordinates must lie in `[0, 1]` to keep time monotone. The y
 * coordinates are finite and may overshoot the output interval.
 */
export interface IAutoMovieCubicBezierControlPoints {
  /** Time coordinate of the first control. */
  x1: number;

  /** Progress coordinate of the first control. */
  y1: number;

  /** Time coordinate of the second control. */
  x2: number;

  /** Progress coordinate of the second control. */
  y2: number;
}
