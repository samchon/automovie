/** Scalar knots for the sweep tension spline and its optional periodic domain. */
export namespace IAutoMovieInterpolateSpline {
  /**
   * Build a C2 interpolant through knots with a sampled overshoot policy: the
   * spline under tension of `AutoMovieEngineSpline`, at tension 0 a cubic spline and
   * with a searched tension whose sixteen-part segment scan stays within a
   * tenth of the largest value step within two segments. This is a sampled
   * policy, not a strict bound on extrema; the fixed maximum tension can be
   * returned without scan acceptance. Positive data can produce negative
   * interpolation.
   *
   * It passes through its knots with continuous curvature at interior knots.
   * Constant extension outside open knots need not preserve the endpoint
   * derivative. Radius and scale consumers must refuse invalid query results.
   * Open knots extend flat: below the first knot the curve holds the first
   * value and above the last it holds the last, with second derivative 0 at
   * both ends. Periodic knots wrap: `period` is the length after which the
   * curve repeats and every knot lies in `[0, period)`. One knot gives a
   * constant, two open knots a straight segment.
   */
  export type IProps = {
    /**
     * Nonempty finite strictly increasing abscissae, copied into compiled
     * storage. interpolateAutoMovieSpline rejects duplicates and unsorted
     * values; query arguments and period use the same caller-chosen unit.
     */
    knots: readonly number[];

    /**
     * Finite ordinates, exactly one per knot, copied at construction. Results
     * use this unit. Positive input does not guarantee positive between-knot
     * values, so geometric consumers perform their own result admission.
     */
    values: readonly number[];

    /**
     * Finite repeat length in knot units, requiring all knots in [0,period).
     * Omitted means an open spline held constant beyond its endpoints. A single
     * knot is constant; two open knots interpolate linearly.
     */
    period?: number;
  };
}
