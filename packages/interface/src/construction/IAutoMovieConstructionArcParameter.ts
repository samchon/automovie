/**
 * The curve's own arclength over its whole length, times a turn, as a join
 * curve's parameter.
 *
 * The engine walks the loop from the seed by pseudo-arclength continuation.
 * It reads a point's parameter as its foot on the periodic cubic B-spline
 * through samples at uniform accumulated chord distances. Parameter 0 is the
 * seed's point and increases along `n_part x n_host`.
 */
export interface IAutoMovieConstructionArcParameter {
  /** Discriminator. */
  type: "arc";
}
