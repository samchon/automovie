/** Scalar data for an open or periodic shape-preserving cubic interpolant. */
export namespace IAutoMovieInterpolateMonotone {
  /**
   * Build a shape-preserving piecewise cubic interpolant through knots, the
   * Fritsch-Carlson scheme.
   *
   * Between two knots the curve is a cubic Hermite segment whose end slopes are
   * set so that it stays monotone: it never leaves the range of the two knot
   * values it joins, so a profile that rises and falls has its maximum at a
   * knot and invents no bulge or dip between distant knots, which a plain cubic
   * spline or Catmull-Rom curve does. Slopes follow Fritsch and Carlson (1980,
   * SIAM J. Numer. Anal. 17(2):238-246): each interior slope starts as the mean
   * of the secants on its two sides, or zero where they differ in sign or
   * either is zero (a local extremum or a flat run); each segment whose slope
   * ratios `alpha = m_k / d_k` and `beta = m_{k+1} / d_k` leave the circle of
   * radius 3 has both slopes scaled back onto it. Interior joins are C1; an
   * open curve's constant extension can have a derivative jump at an endpoint
   * with nonzero slope.
   *
   * Open knots extrapolate flat: below the first knot the curve holds the first
   * value and above the last it holds the last. An open curve's end slopes are
   * the adjacent secants, limited by the same rule. Periodic knots wrap:
   * `period` is the length after which the curve repeats, every knot lies in
   * `[0, period)`, and the segment from the last knot to the first plus one
   * period closes the loop with slopes taken across the wrap.
   *
   * A single knot gives a constant curve. Knots must be finite and strictly
   * increasing, with one value per knot.
   */
  export type IProps = {
    /**
     * Nonempty finite strictly increasing abscissae, copied at construction.
     * Their unit is chosen by the caller and must match each query and period;
     * interpolateAutoMovieMonotone rejects duplicate or unsorted knots.
     */
    knots: readonly number[];

    /**
     * One finite ordinate per knot, copied at construction. The interpolant
     * returns this same caller-chosen unit; signs and magnitude are otherwise
     * unrestricted. A single value defines a constant.
     */
    values: readonly number[];

    /**
     * Finite repeat length in knot units. If supplied, every knot must lie in
     * [0,period); admission therefore requires a positive period. Omission
     * gives constant extension outside the open knot interval.
     */
    period?: number;
  };
}
