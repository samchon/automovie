import { IAutoMovieVector3 } from "@automovie/interface";
import { nearestHullEdge } from "./nearestHullEdge";
import { pointInHull } from "./pointInHull";
/**
 * Distance from `point` to a convex hull on the XZ plane: `0` when inside,
 * otherwise the distance to the nearest boundary. Degenerate hulls fall back to
 * the distance to their single vertex (size 1) or segment (size 2).
 *
 * @evidence contracts/common.md#principled-implementation Convex counter-clockwise half-planes decide interior zero distance; outside points use the nearest horizontal boundary, with explicit empty, point and segment degeneracies.
 * @evidence contracts/common.md#clear-and-simple-design pointInHull and nearestHullEdge own containment and boundary selection, while this adapter supplies support-distance meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty hull yields Infinity rather than invented support, and degenerate hulls keep their actual point or segment geometry.
 * @evidence contracts/common.md#meaningful-documentation States XZ distance, zero interior value, empty Infinity result and singleton/segment interpretations.
 * @evidence contracts/performance.md#efficient-algorithms Containment and any required boundary scan each cost O(H); interior queries skip projection work.
 * @evidence contracts/performance.md#reuse-equivalent-work The containment verdict skips edge distances for interior points, without caching mutable support coordinates across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar distance escapes; any boundary record is temporary and no hull or query reference remains.
 */
export const pointHullDistance: (point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]) => number = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): number => {
  if (hull.length === 0) return Infinity;
  if (hull.length === 1) return distanceXZ(point, hull[0]!);
  if (pointInHull(point, hull)) return 0;
  return nearestHullEdge(point, hull).distance;
};

const distanceXZ: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.z - b.z);
