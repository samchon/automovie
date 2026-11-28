/**
 * A periodic scalar on a port's clock, read with the two derivatives a band's
 * jets need: a port curve's share between its columns, a curved rail's station,
 * the band's cross speed on each side and its correspondence to the part's
 * phase.
 */
export namespace IAutoMovieConstructionPortField {
  /**
   * Periodic scalar field with derivatives in clock radians, whole-turn value
   * and slope bounds and local value-range bounds. The field's role determines
   * its output units. Constant fields use the same interface.
   */
  export interface IField {
    /**
     * Value, first derivative and second derivative at a port clock in radians,
     * in that order.
     */
    at: (psi: number) => [number, number, number];

    /**
     * Lower and upper value bounds across the complete clock cycle, derived
     * from the periodic cubic's extreme controls.
     */
    bounds: [number, number];

    /**
     * Lower and upper first-derivative bounds per radian across all spans, from
     * the span quadratics.
     */
    slopes: [number, number];

    /**
     * Value bounds over the included clock spans between from and to, in
     * radians. The reader uses the local control extrema or the complete
     * controls when the interval covers the loop.
     */
    range: (from: number, to: number) => [number, number];
  }
}
