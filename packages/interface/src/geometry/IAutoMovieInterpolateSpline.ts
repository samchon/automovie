/** Scalar data for open or periodic spline reconstruction under tension. */
export namespace IAutoMovieInterpolateSpline {
  /**
   * Scalar knots and optional repeat length for the sweep spline with sampled
   * overshoot policy.
   *
   * A natural open spline has zero endpoint curvature and is held constant
   * outside its knots. Periodic evaluation closes across the repeat length. One
   * knot gives a constant profile and two open knots give linear interpolation
   * within their span.
   */
  export type IProps = {
    /** Nonempty finite strictly increasing abscissae in the caller's knot unit. */
    knots: readonly number[];

    /**
     * One finite ordinate per knot, in the result unit. Positive inputs can
     * produce negative between-knot values.
     */
    values: readonly number[];

    /**
     * Finite repeat length requiring knots in [0, period). Omission gives open
     * constant endpoint extension.
     */
    period?: number;
  };
}
