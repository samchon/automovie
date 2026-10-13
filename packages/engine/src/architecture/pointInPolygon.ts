import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";

/**
 * Whether a point is inside a simple polygon, its own boundary included.
 *
 * Exported so the architecture graph has one planar containment answer:
 * {@link polygonInside} and {@link polygonsOverlap} build on it, and the
 * footprint-ring placement in `space` classifies points with it. A point on an
 * edge or vertex counts as inside, by {@link pointOnSegment}'s scale-relative
 * `PLANAR_EPSILON` tolerance. The polygon is an implicitly closed ring in any
 * winding; the answer is meaningless for a self-crossing ring, and an empty
 * ring contains nothing.
 *
 * @param point Point to classify, in the polygon's planar frame.
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when the point is inside or on the boundary.
 *
 * @evidence contracts/common.md#principled-implementation Boundary contact is decided first by the shared point-on-segment predicate, then the interior by the even-odd ray-crossing rule with the half-open `y` test, which counts a vertex on the ray once; the rule is exact for simple rings, which every caller has validated, and arbitrary for self-crossing ones, a limitation the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design The single planar containment test in the engine: polygon containment, polygon overlap and footprint-ring placement call it, and its edge test is the shared `pointOnSegment` rather than a private copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No figure, coordinate or caller is special-cased; boundary points are inside by the stated rule, not by an adjustment for any one consumer.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the boundary rule and its tolerance, the ring convention and winding freedom, the self-crossing and empty cases, and who relies on it.
 * @evidence contracts/performance.md#efficient-algorithms Two passes over the n edges, O(n) time and O(1) space; the boundary pass must finish before the parity pass because a boundary hit overrides parity, and a full edge scan is the lower bound for an unindexed ring.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure query over one point and one ring that coordinates no work across requests; a caller testing many points against one ring owns any indexing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a loop index and one parity flag for the call and allocates nothing, so nothing outlives it.
 */
export const pointInPolygon = (
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
