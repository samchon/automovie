import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";

/**
 * The swing region of a ball joint's constraint on its frame, built once where
 * the joint is prepared: how far the limb may point from rest along each great
 * circle leaving rest.
 */
export interface IAutoMovieSwingTwistRegion {
  /** The constraint this region was built for. */
  readonly constraint: IAutoMovieJointConstraint;

  /** The radius on each great circle, degrees. */
  readonly table: Float64Array;

  /**
   * The farthest the limb may point from rest on any great circle, the bound
   * every great circle's radius is at most, degrees.
   */
  readonly greatest: number;
}
