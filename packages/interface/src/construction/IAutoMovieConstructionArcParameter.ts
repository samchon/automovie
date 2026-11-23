/**
 * The curve's own arclength over its whole length, times a turn, as a join
 * curve's parameter.
 *
 * The engine walks the loop from the seed by pseudo-arclength continuation,
 * walks it again in equal chords of its length, and reads a point's parameter
 * as its foot on the periodic cubic B-spline through those points; parameter 0
 * is the seed's point and it increases along `n_part x n_host`.
 */
export interface IAutoMovieConstructionArcParameter {
  /** Discriminator. */
  type: "arc";
}
