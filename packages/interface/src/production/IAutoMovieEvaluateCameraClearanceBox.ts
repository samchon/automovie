import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** An inclusive world-space axis-aligned box, in metres. */
export interface IAutoMovieEvaluateCameraClearanceBox {
  /** Smallest corner. */
  min: IAutoMovieVector3;

  /** Largest corner. */
  max: IAutoMovieVector3;
}
