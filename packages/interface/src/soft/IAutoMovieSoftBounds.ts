import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A world-space axis-aligned box. */
export interface IAutoMovieSoftBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
