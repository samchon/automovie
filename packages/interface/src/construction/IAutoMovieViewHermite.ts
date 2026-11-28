/** Data and callback contracts shared by the ViewHermite operations. */
export namespace IAutoMovieViewHermite {
  /**
   * Prepared quintic interpolation for one scalar outline. The knots and
   * derivative rows use the unnormalized source parameter. Each stored span
   * evaluates its polynomial at the fraction between adjoining knots, with the
   * left source value as the constant coefficient.
   */
  export interface ICurve {
    /**
     * Ordered knots in the actual source parameter, shared with the underlying
     * prepared spline.
     */
    xs: readonly number[];
    /** Scalar values at the source knots, in the receiving outline's units. */
    ys: readonly number[];
    /** First derivative at each knot in units per source-parameter unit. */
    first: readonly number[];
    /**
     * Second derivative at each knot in units per squared source-parameter
     * unit.
     */
    second: readonly number[];
    /**
     * Five coefficients c1 through c5 for each unit span. Use its left knot
     * value ys[i] as c0.
     */
    coefficients: readonly (readonly number[])[];
  }
}
