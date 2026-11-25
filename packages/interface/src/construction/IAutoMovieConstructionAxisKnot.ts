import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One knot of a curved axis: the course's point at a station. */
export interface IAutoMovieConstructionAxisKnot {
  /** Station, metres, strictly increasing over the course's knots. */
  station: number;

  /** The course's point there, metres in the construction's frame. */
  point: IAutoMovieVector3;
}
