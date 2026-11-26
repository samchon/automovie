import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointOnSegment } from "./pointOnSegment";

/**
 * Whether a point is inside a simple polygon, its own boundary included.
 *
 * {@link polygonInside}, {@link polygonsOverlap} and footprint-ring placement
 * share this answer. A point on an edge or vertex counts as inside under
 * {@link pointOnSegment}'s scale-relative `PLANAR_EPSILON` tolerance. The
 * polygon is an implicitly closed simple ring in either winding; an empty ring
 * contains nothing. Self-crossing rings are outside the geometric contract even
 * though the loop still evaluates parity.
 *
 * @param point Point to classify, in the polygon's planar frame.
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns True when the point is inside or on the boundary.
 */
export function pointInPolygon(
  point: IAutoMoviePlanarPoint,
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean {
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
}
