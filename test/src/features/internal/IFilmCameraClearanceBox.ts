import type { IAutoMovieVector3 } from "@automovie/interface";

/** Original world-space clearance obstacle bounds. */
export interface IFilmCameraClearanceBox {
  /** Lower bound in metres. */
  min: IAutoMovieVector3;

  /** Upper bound in metres. */
  max: IAutoMovieVector3;
}
