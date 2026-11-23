import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A target that is a fixed world point, for a place no staged node marks, such
 * as a spot on the ground to walk to. Use an {@link IAutoMovieNodeTarget} when
 * the target is a thing in the scene.
 *
 * `resolveTargetPoint` returns the point itself, and `performShot` refuses a
 * missing point or one with a non-finite coordinate. A camera framing a point
 * frames a stand-in figure of default height standing on it.
 */
export interface IAutoMoviePointTarget {
  /** Selects a fixed world-space point as the target representation. */
  kind: "point";

  /** World-space point in metres. */
  point: IAutoMovieVector3;
}
