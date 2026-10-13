import { IAutoMovieVector3 } from "@automovie/interface";

import { nearestHullEdge } from "./nearestHullEdge";
import { pointInHull } from "./pointInHull";

/**
 * Distance from `point` to a convex hull on the XZ plane: `0` when inside,
 * otherwise the distance to the nearest boundary. Degenerate hulls fall back to
 * the distance to their single vertex (size 1) or segment (size 2).
 */
export const pointHullDistance = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): number => {
  if (hull.length === 0) return Infinity;
  if (hull.length === 1) return distanceXZ(point, hull[0]!);
  if (pointInHull(point, hull)) return 0;
  return nearestHullEdge(point, hull).distance;
};

const distanceXZ = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.z - b.z);
