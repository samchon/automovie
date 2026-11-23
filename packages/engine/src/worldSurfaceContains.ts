import {
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { closestPointOnSegmentXZ } from "./math/closestPointOnSegmentXZ";

/** Plan distance, in metres, within which a point lies on a footprint edge. */
const EDGE_TOLERANCE: number = 1e-9;

/**
 * Whether an XZ point lies on a world surface's footprint, its edge included.
 *
 * The footprint is the surface's `polygon`, an implicitly closed ring in plan.
 * A point within 1e-9 m of any edge is on the surface, because the edge of a
 * floor is still floor; otherwise the even-odd ray-crossing rule decides. The
 * answer is exact for a simple ring and arbitrary for a self-crossing one, and
 * an empty ring contains nothing. Height is not consulted.
 *
 * @param surface World surface whose footprint is tested.
 * @param point Plan position in world metres.
 * @returns True when the point is inside or on the footprint.
 */
export const worldSurfaceContains = (
  surface: Pick<IAutoMovieWorldSurface, "polygon">,
  point: Pick<IAutoMovieVector3, "x" | "z">,
): boolean => {
  const polygon: IAutoMovieWorldSurface["polygon"] = surface.polygon;
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
    const current: IAutoMovieWorldSurface["polygon"][number] = polygon[index]!;
    const prior: IAutoMovieWorldSurface["polygon"][number] = polygon[previous]!;
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
};
