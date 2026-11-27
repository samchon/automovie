import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Signed distance and surface witnesses between two convex colliders. */
export interface IAutoMoviePhysicalShapePairContact {
  /** Signed distance in metres, negative when the colliders overlap. */
  distance: number;

  /** Unit normal from the first shape toward the second, in the world frame. */
  normal: IAutoMovieVector3;

  /** The first shape's witness in world metres. */
  pointA: IAutoMovieVector3;

  /** The second shape's witness in world metres. */
  pointB: IAutoMovieVector3;
}
