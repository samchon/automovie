import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * One authored outer contour with optional holes in a common local XY metre
 * frame.
 *
 * Use finite simple rings with nonzero area, contours separated from one
 * another and no duplicated closing point. Winding may be selected
 * independently for each input ring.
 */
export interface IAutoMoviePlanarRegion {
  /**
   * Borrowed simple outer ring with at least three finite XY points. Supply no
   * repeated closing vertex because closure is implicit.
   */
  outer: readonly IAutoMovieProfilePoint[];

  /**
   * Borrowed hole rings in declaration order, disjoint and strictly within the
   * outer ring. Omission or an empty list describes no voids.
   */
  holes?: readonly (readonly IAutoMovieProfilePoint[])[] | undefined;
}
