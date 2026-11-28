/** Model-metre knot spacing inputs for a sweep feature course. */
export namespace IAutoMovieCompileSweepFeature {
  /**
   * Metre length and radius scales for compiling a feature course in the
   * sweep's cylindrical coordinates.
   *
   * The displacement query uses a local cylindrical metric, while these metre
   * scales establish the course fit. Use positive finite values whose scaled
   * chord differences remain representable.
   */
  export type IScale = {
    /**
     * Spine control-polygon length in metres, multiplying normalized chord
     * differences for feature-knot spacing.
     */
    length: number;

    /**
     * Mean unscaled metre radius of the authored station samples, multiplying
     * angle differences in radians during course compilation.
     */
    radius: number;
  };
}
