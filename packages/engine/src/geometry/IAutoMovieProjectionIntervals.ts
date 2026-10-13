/**
 * Outward-enclosed projections of represented points along a stored direction.
 *
 * Interval i encloses point i's projection relative to the origin, scaled by
 * the direction normalized only by its largest component, in metres of the
 * points' frame. `normUpper` is an upper enclosure of that scaled direction's
 * Euclidean norm. A zero direction yields zero intervals and zero norm.
 *
 * @author Samchon
 */
export interface IAutoMovieProjectionIntervals {
  /**
   * One owned [low, high] projection enclosure per input point, in input order.
   */
  intervals: [number, number][];

  /** Upper enclosure of the scaled direction's Euclidean norm. */
  normUpper: number;
}
