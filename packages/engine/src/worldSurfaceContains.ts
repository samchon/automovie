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
 *
 * @evidence contracts/common.md#principled-implementation The boundary is tested first by plan distance to each edge through `closestPointOnSegmentXZ`, then the interior by the even-odd ray-crossing rule with the half-open `z` test, which counts a vertex on the ray once; the 1e-9 m band is far below any authored footprint and absorbs coordinates that were computed rather than typed.
 * @evidence contracts/common.md#clear-and-simple-design One footprint containment rule for the world, shared by the ground oracle `worldGroundSurface` and the placement gate `assertWorldPlacements`, which previously kept identical private ray-casts and distance helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface or coordinate is special-cased; edge points count as inside by the stated floor-edge rule for every caller.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the ring convention, the edge rule with its tolerance and reason, the interior rule, the self-crossing and empty cases, that height is ignored, and the units.
 * @evidence contracts/performance.md#efficient-algorithms Two passes over the n footprint edges, O(n) time and O(1) space, returning early on an edge hit; an unindexed ring needs a full scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure query over one point and one footprint that coordinates no work across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one closest-point record per edge test and retains nothing after returning.
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
