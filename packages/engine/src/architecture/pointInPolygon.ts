import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";

/**
 * Whether a point is inside a simple polygon, its own boundary included.
 *
 * Exported so the architecture graph has one planar containment answer:
 * {@link polygonInside} and {@link polygonsOverlap} build on it, and the
 * footprint-ring placement in `space` classifies points with it. A point on an
 * edge or vertex, within `PLANAR_EPSILON` scaled by the edge's size, counts as
 * inside. The polygon is a closed ring in any winding; the answer is
 * meaningless for a self-crossing one.
 *
 * @evidence contracts/common.md#principled-implementation Tests boundary contact first with a scale-relative cross-product tolerance, then applies the even-odd ray-casting rule along +x; the half-open `from.y > y !== to.y > y` test counts a vertex on the ray once and never divides by a horizontal edge's zero height.
 * @evidence contracts/common.md#clear-and-simple-design The tolerance lives in the private `side` and `pointOnSegment` helpers, but those helpers are copied verbatim into `polygonInside`, `polygonIsSimple` and `polygonsOverlap` instead of shared, so the planar predicates the prose calls one answer exist in four copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Treats the boundary as inside by contract, which is what lets a flush sill or a port on a face edge pass; no polygon or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the boundary-inclusive answer and its tolerance, the accepted windings, the simple-polygon premise, and which callers share the predicate.
 * @evidence contracts/performance.md#cost-and-resources Two linear passes over the n edges, boundary contact then crossings, with no allocation, cache or retained state; fusing them would halve the work without changing the O(n) bound.
 */
export const pointInPolygon = (
  point: IAutoMoviePlanarPoint,
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index = 0; index < polygon.length; ++index)
    if (
      pointOnSegment(
        point,
        polygon[index]!,
        polygon[(index + 1) % polygon.length]!,
      )
    )
      return true;
  let inside = false;
  for (let index = 0; index < polygon.length; ++index) {
    const from = polygon[index]!;
    const to = polygon[(index + 1) % polygon.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};

/** Which side of the directed line `from -> to` a point falls on. */
const side = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): number => {
  const cross =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};

/** Whether a point lies on a segment, its endpoints included. */
const pointOnSegment = (
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean =>
  side(from, to, point) === 0 &&
  point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
  point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
  point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
  point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON;
