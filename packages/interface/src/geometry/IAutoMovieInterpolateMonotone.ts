/** Scalar data for open or periodic monotone cubic reconstruction. */
export namespace IAutoMovieInterpolateMonotone {
  /**
   * Scalar abscissae and ordinates for a shape-preserving Hermite interpolant,
   * with optional repeat length.
   *
   * The Fritsch?Carlson limiter sets interior slopes to zero at sign changes or
   * flat runs and bounds adjoining secant ratios. Interior joins are
   * continuously differentiable. A held open endpoint can have a derivative
   * jump.
   */
  export type IProps = {
    /**
     * Nonempty finite strictly increasing abscissae. Query input and optional
     * repeat length use this unit.
     */
    knots: readonly number[];

    /**
     * One finite ordinate per knot in the output unit. A single ordinate yields
     * a constant profile.
     */
    values: readonly number[];

    /**
     * Finite repeat length in knot units, requiring knots in [0, period).
     * Omission holds endpoint values outside the open span.
     */
    period?: number;
  };
}
