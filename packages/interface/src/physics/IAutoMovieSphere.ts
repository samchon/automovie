import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A world-space sphere supplied as an approximate collider for a segment hit. */
export interface IAutoMovieSphere {
  /** Borrowed world-space center in metres; intersection admits finite values. */
  center: IAutoMovieVector3;

  /** Positive radius in world meters. */
  radius: number;
}
