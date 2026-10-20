/**
 * Outward-enclosed projections of represented points along a stored direction,
 * produced by `measureAutoMovieProjectionIntervals`.
 *
 * Interval i encloses point i's projection relative to the origin onto the
 * direction scaled so its largest absolute component is one, in metres of the
 * points' frame times that scaled direction's norm, which lies in [1, sqrt(3)].
 * `normUpper` is an upper enclosure of that norm, so dividing a gap between
 * intervals by it gives a Euclidean lower bound. A zero direction yields
 * [0, 0] for every point and a zero norm.
 *
 * @evidence contracts/common.md#principled-implementation Every subtraction, product and sum is widened to its adjacent binary64 neighbours, and the norm is raised until its rounded-down square covers the outward squared norm, so each true projection lies inside its interval and the true norm never exceeds `normUpper`.
 * @evidence contracts/common.md#clear-and-simple-design Intervals plus one norm bound is the shared input of projection separation and attachment contact, which compare interval ends and divide by the norm themselves, so neither recomputes the enclosure arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No spatial tolerance widens an interval; the only widening is one ulp per rounded operation, and a zero direction reports a zero norm that its consumers treat as no proof.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the projection's reference point and scaling, the unit and its norm range, what `normUpper` bounds and why, and the zero-direction result.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the per-point enclosure, linear in the point count, is answered on `measureAutoMovieProjectionIntervals`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per direction and consumed at once by the separation or contact bound that asked for it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one two-number tuple per input point and no reference to the points, so its size is the caller's point count and it is dropped by the bound that consumes it.
 */
export interface IAutoMovieProjectionIntervals {
  /**
   * One owned [low, high] projection enclosure per input point, in input order.
   */
  intervals: [number, number][];

  /**
   * Upper enclosure of the scaled direction's Euclidean norm; zero only for a
   * zero direction.
   */
  normUpper: number;
}
