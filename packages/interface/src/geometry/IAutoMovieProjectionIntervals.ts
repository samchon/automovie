/**
 * Outward projection enclosures along a stored direction relative to the
 * supplied reference point.
 *
 * All point and reference coordinates use the same metre frame. The default
 * reference is the first input point. Dividing a proved positive projection gap
 * by the norm enclosure gives a conservative Euclidean lower bound.
 */
export interface IAutoMovieProjectionIntervals {
  /**
   * One owned [low, high] interval per input point, in input order and relative
   * to the reference origin. A zero direction yields [0, 0] for every admitted
   * point.
   */
  intervals: [number, number][];

  /**
   * Upper enclosure of the scaled direction's Euclidean norm. A zero direction
   * gives zero and supplies no positive separation proof.
   */
  normUpper: number;
}
