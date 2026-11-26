import type {
  IAutoMovieGroundQueryPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { closestPointOnSegmentXZ } from "../../../math/internal/closestPointOnSegmentXZ";

/**
 * Whether an XZ point lies on a world surface's footprint, its edge included.
 *
 * The footprint is an implicitly closed ring in plan. A point within 1e-9 m of
 * any edge is on the surface, because the edge of a floor is still floor;
 * otherwise the even-odd ray-crossing rule decides. The answer is exact for a
 * simple ring and arbitrary for a self-crossing one, and an empty ring contains
 * nothing. Height is not consulted.
 *
 * @param polygon World surface footprint in XZ.
 * @param point Plan position in world metres.
 * @returns True when the point is inside or on the footprint.
 */
export function surfaceContainsPoint(
  polygon: readonly IAutoMovieGroundQueryPoint[],
  point: IAutoMovieGroundQueryPoint,
): boolean {
  for (let index: number = 0; index < polygon.length; ++index) {
    const nearest: IAutoMovieVector3 = closestPointOnSegmentXZ(
      point,
      polygon[index]!,
      polygon[(index + 1) % polygon.length]!,
    );
    if (Math.hypot(point.x - nearest.x, point.z - nearest.z) <= EDGE_TOLERANCE)
      return true;
  }
  let inside: boolean = false;
  for (
    let index: number = 0, previous: number = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const current: IAutoMovieGroundQueryPoint = polygon[index]!;
    const prior: IAutoMovieGroundQueryPoint = polygon[previous]!;
    if (
      current.z > point.z !== prior.z > point.z &&
      point.x <
        ((prior.x - current.x) * (point.z - current.z)) /
          (prior.z - current.z) +
          current.x
    )
      inside = !inside;
  }
  return inside;
}

/** Plan distance, in metres, within which a point lies on a footprint edge. */
const EDGE_TOLERANCE: number = 1e-9;
