/**
 * Outward-enclosed projections of represented points along a stored direction,
 * produced by `measureAutoMovieProjectionIntervals`.
 *
 * Interval i encloses point i's projection relative to the origin onto the
 * direction scaled so its largest absolute component is one, in metres of the
 * points' frame times that scaled direction's norm, which lies in [1, sqrt(3)].
 * `normUpper` is an upper enclosure of that norm, so dividing a gap between
 * intervals by it gives a Euclidean lower bound. A zero direction yields [0, 0]
 * for every point and a zero norm.
 */
export interface IAutoMovieProjectionIntervals {
  /** One owned [low, high] projection enclosure per input point, in input order. */
  intervals: [number, number][];

  /**
   * Upper enclosure of the scaled direction's Euclidean norm; zero only for a
   * zero direction.
   */
  normUpper: number;
}
