import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";

/**
 * Whether a point is inside a simple polygon, its own boundary included.
 *
 * {@link polygonInside}, {@link polygonsOverlap} and footprint-ring placement share this answer. A point on an edge or vertex counts as inside under {@link pointOnSegment}'s scale-relative `PLANAR_EPSILON` tolerance. The polygon is an implicitly closed simple ring in either winding; an empty ring contains nothing. Self-crossing rings are outside the geometric contract even though the loop still evaluates parity.
 *
 * @param point Point to classify, in the polygon's planar frame.
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when the point is inside or on the boundary.
 *
 * @evidence contracts/common.md#principled-implementation Applies the shared boundary predicate, then even-odd ray crossing with a half-open y test to avoid counting a ray vertex twice. The intended premise is a finite simple ring and finite computed intersections; this function does not validate it, and binary64 arithmetic and boundary tolerance do not provide an exact-predicate guarantee.
 * @evidence contracts/common.md#clear-and-simple-design The single planar containment test in the engine: polygon containment, polygon overlap and footprint-ring placement call it, and its edge test is the shared `pointOnSegment` rather than a private copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No figure, coordinate or caller is special-cased; boundary points are inside by the stated rule, not by an adjustment for any one consumer.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the boundary rule and its tolerance, the ring convention and winding freedom, the self-crossing and empty cases, and who relies on it.
 * @evidence contracts/performance.md#efficient-algorithms At most two passes over n edges, O(n) time and O(1) space, with immediate return on a boundary hit. Boundary and parity work could also be combined; the separate passes keep the two rules explicit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure query over one point and one ring that coordinates no work across requests; a caller testing many points against one ring owns any indexing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a loop index and one parity flag for the call and allocates nothing, so nothing outlives it.
 */
export const pointInPolygon: (point: IAutoMoviePlanarPoint, polygon: readonly IAutoMoviePlanarPoint [ ]) => boolean = (
  point: IAutoMoviePlanarPoint,
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index: number = 0; index < polygon.length; ++index)
    if (
      pointOnSegment(
        point,
        polygon[index]!,
        polygon[(index + 1) % polygon.length]!,
      )
    )
      return true;
  let inside: boolean = false;
  for (let index: number = 0; index < polygon.length; ++index) {
    const from: IAutoMoviePlanarPoint = polygon[index]!;
    const to: IAutoMoviePlanarPoint = polygon[(index + 1) % polygon.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};
