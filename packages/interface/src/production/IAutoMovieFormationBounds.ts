import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Axis-aligned world-space bounds of a compact formation range. */
export interface IAutoMovieFormationBounds {
  /** Minimum world-space corner. */
  min: IAutoMovieVector3;

  /** Maximum world-space corner. */
  max: IAutoMovieVector3;
}
