import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Point and partial derivatives, world mm per mm of station and per radian of phase.
 *
 * @evidence contracts/development/design.md#principled-representation Names the point and all five first/second partial derivatives of one surface chart reading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Six vector fields carry value and derivative orders without hidden computed state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Describes exact chart derivatives; the type itself does not validate their numerical correctness or finiteness.
 * @evidence contracts/development/common.md#meaningful-documentation Each field names its derivative; station uses mm and phase radians.
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
