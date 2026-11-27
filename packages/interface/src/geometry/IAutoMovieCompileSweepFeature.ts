/**
 * Compile-time length scales for fitting a feature course in the sweep's
 * cylindrical domain.
 */
export namespace IAutoMovieCompileSweepFeature {
  /**
   * Compile one feature curve of a sweep into the radius change it makes at a
   * point of the sweep's domain.
   *
   * The curve is the centripetal Catmull-Rom spline through its points in the
   * `(u, angle)` domain, each angle unwrapped so consecutive points take the
   * shorter way round and a point repeating its predecessor dropped, continued
   * straight beyond its ends through reflected phantom points. Its knots are
   * spaced by the square root of each chord measured in metres, `u` by the
   * spine's length and angle by the sweep's mean radius, so each segment has no
   * cusp or self-intersection however unevenly its points are spaced (Yuksel,
   * Schaefer and Keyser 2011, Computer-Aided Design 43(7):747-755), and it is
   * C1 in that knot parameter. Its radius or offset follows the same parameter
   * by `interpolateSpline`, so it too runs smoothly along the curve.
   * At a query point a nearest candidate on the curve is searched in a local
   * cylindrical metric: `u` scaled by the spine's length and angle by the
   * query's radius before features. This approximates surface distance; it is
   * not the arc metric of a noncircular section. The search seeds sixteen times
   * the number of segments uniformly over the knot span and refines the nearest
   * seed by four Newton steps. It keeps the seed if refinement moves further
   * away; this local search does not guarantee the global nearest point. Its
   * smooth course removes polyline corners, though a nearest-branch change
   * inside a bend tighter than the band can still crease the field. The radius
   * moves by the residual there, the declared radius less the surface's radius
   * at the curve or the declared offset, times `(1 - (d / width)^2)^3` within
   * `width`, a falloff with continuous curvature at the band's edge.
   */
  export type IScale = {
    /**
     * Spine polygon length in metres, multiplying differences in normalized
     * spine u when spacing the feature's centripetal knots.
     * compileSweep supplies path.length; this helper does not validate
     * it.
     */
    length: number;

    /**
     * Mean unscaled station radius in metres, multiplying angular differences
     * in radians for knot spacing. This compile-time metric is distinct from
     * the local pre-feature radius used for each displacement query.
     */
    radius: number;
  };
}
