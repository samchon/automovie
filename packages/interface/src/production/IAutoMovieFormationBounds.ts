import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned world-space bounds of regenerated slot positions, in meters;
 * model extents and instantaneous motion are not included.
 */
export interface IAutoMovieFormationBounds {
  /** Minimum world-space corner. */
  min: IAutoMovieVector3;

  /** Maximum world-space corner. */
  max: IAutoMovieVector3;
}
