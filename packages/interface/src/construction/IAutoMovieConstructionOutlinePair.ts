import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * One view's two edges of a part, as signed chart coordinates of the section's
 * extremes on either side of the axis.
 *
 * `positive` is the coordinate of the extreme on the axis's positive side and
 * must stay above zero, `negative` the coordinate on its negative side and must
 * stay below zero: a box that does not hold its axis strictly inside it cannot
 * be a polar section about that axis, and the engine leaves such a station out
 * with one diagnostic.
 */
export interface IAutoMovieConstructionOutlinePair {
  /**
   * The edge on the positive side of the axis, metres, above zero at every
   * station.
   */
  positive: IAutoMovieConstructionOutline;

  /**
   * The edge on the negative side of the axis, metres, below zero at every
   * station.
   */
  negative: IAutoMovieConstructionOutline;
}
