import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** An axis-aligned world-space effect volume. */
export interface IAutoMovieWorldBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
