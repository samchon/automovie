/**
 * A feature's compiled domain course and radial displacement field, shared by
 * sweep evaluation and construction observations.
 *
 * The closures retain the compiled course coefficients and the feature width.
 * Treat the source feature as immutable while they live. compileAutoMovieSweep
 * admits the authored feature before compilation; these query signatures do not
 * enforce finite arguments. Returned domain records are newly allocated and
 * caller-owned.
 */
export interface IAutoMovieCompileSweepFeatureOutput {
  /**
   * Signed radial change in metres, zero outside the feature band.
   * Nearest-course search uses a local cylindrical metric and is not a global
   * nearest-point guarantee.
   *
   * @param u Normalized spine coordinate of the query
   * @param angle Polar direction in radians about the section origin
   * @param local Positive pre-feature, unscaled radius at the query, in metres
   * @param length Spine polygon length in metres, scaling longitudinal
   *   differences
   * @param guided Synchronous pre-feature unscaled radius evaluator taking u
   *   and radians and returning metres; called for absolute-radius features,
   *   never retained, and exceptions propagate
   * @returns Offset feature value, or absolute feature radius minus guided
   *   radius at the selected course point, multiplied by the compact band
   *   falloff
   */
  displacement: (
    u: number,
    angle: number,
    local: number,
    length: number,
    guided: (u: number, angle: number) => number,
  ) => number;

  /**
   * Domain point at a clamped share of the centripetal knot span; v is in
   * unwrapped turns and a collapsed course is constant.
   */
  point: (t: number) => {
    /**
     * Spine coordinate on the fitted course. The query share is clamped, but
     * the cubic course itself can overshoot its authored u values.
     */
    u: number;

    /**
     * Unwrapped angular course coordinate in turns; divide the fitted radian
     * angle by 2*pi without wrapping the result.
     */
    v: number;
  };
}
