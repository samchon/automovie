import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Axis-aligned box in the coordinate frame of its owning result. */
export interface IAutoMovieSoftBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
