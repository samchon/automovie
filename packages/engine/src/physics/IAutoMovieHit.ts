import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A detected hit: the parameter/time of first contact and the contact point.
 */
export interface IAutoMovieHit {
  /** Time (or segment parameter) of first contact. */
  time: number;
  /** World point of first contact. */
  point: IAutoMovieVector3;
}
