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
 * @evidence contracts/development/design.md#principled-representation Every subtraction, product and sum is widened to its adjacent binary64 neighbours, and the norm is raised until its rounded-down square covers the outward squared norm, so each true projection lies inside its interval and the true norm never exceeds `normUpper`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Intervals plus one norm bound is the shared input of projection separation and attachment contact, which compare interval ends and divide by the norm themselves, so neither recomputes the enclosure arithmetic.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No spatial tolerance widens an interval; the only widening is one ulp per rounded operation, and a zero direction reports a zero norm that its consumers treat as no proof.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the projection's reference point and scaling, the unit and its norm range, what `normUpper` bounds and why, and the zero-direction result.
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
