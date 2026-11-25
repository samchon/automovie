/**
 * A spline prepared for evaluation; knot arrays are borrowed and must remain
 * unchanged.
 */
export interface IAutoMovieNaturalCubicSpline {
  /** Strictly increasing knot abscissae. */
  xs: readonly number[];

  /** Knot values. */
  ys: readonly number[];

  /** Second derivative at every knot. */
  curvatures: number[];
}
