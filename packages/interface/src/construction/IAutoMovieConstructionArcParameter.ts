/**
 * The curve's own arclength over its whole length, times a turn, as a join curve's parameter.
 *
 * The engine walks the loop from the seed by pseudo-arclength continuation, walks it again in equal chords of its length, and reads a point's parameter as its foot on the periodic cubic B-spline through those points; parameter 0 is the seed's point and it increases along `n_part x n_host`.
 *
 * @evidence contracts/common.md#principled-implementation Arclength fits any closed curve, including the two long sides of a thin part lying along its host, where no phase line or centre angle crosses the curve once (Allgower and Georg, Numerical Continuation Methods, 1990).
 * @evidence contracts/common.md#clear-and-simple-design A record with only its discriminator; the walk needs only the seed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A walk that does not return to its start is reported, never closed by a chord.
 * @evidence contracts/common.md#meaningful-documentation States the walk, the foot rule, the zero and the direction of the parameter.
 */
export interface IAutoMovieConstructionArcParameter {
  /** Discriminator. */
  type: "arc";
}
