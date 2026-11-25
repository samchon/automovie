import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Axis-aligned world-meter volume bounding an environmental effect zone. */
export interface IAutoMovieWorldBounds {
  /** Component-wise minimum world corner in meters. */
  min: IAutoMovieVector3;

  /** Component-wise maximum world corner in meters. */
  max: IAutoMovieVector3;
}
