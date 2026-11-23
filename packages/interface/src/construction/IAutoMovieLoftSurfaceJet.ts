import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Point and partial derivatives, world mm per mm of station and per radian of
 * phase.
 */
export interface IAutoMovieLoftSurfaceJet {
  /** Surface point. */
  p: AutoMovieVector3Tuple;

  /** First station derivative. */
  s: AutoMovieVector3Tuple;

  /** First phase derivative. */
  t: AutoMovieVector3Tuple;

  /** Second station derivative. */
  ss: AutoMovieVector3Tuple;

  /** Mixed derivative. */
  st: AutoMovieVector3Tuple;

  /** Second phase derivative. */
  tt: AutoMovieVector3Tuple;
}
