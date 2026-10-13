import {
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
  IAutoMovieWorldLandmark,
  IAutoMovieWorldRoute,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { segmentsCross } from "./architecture/segmentsCross";
import { closestPointOnSegmentXZ } from "./math/closestPointOnSegmentXZ";
import { worldSurfaceContains } from "./worldSurfaceContains";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/** Largest vertical gap, in metres, between a block base and its support. */
const SUPPORT_TOLERANCE: number = 1e-6;

/**
 * Reject material world-layout contradictions before shot construction.
 *
 * Blocks may touch but not overlap; every base must sit on a declared surface;
 * routes must clear block footprints; every landmark must lie on a walkable
 * surface or within its declared radius of a route.
 *
 * Positions are world metres with Y up, and blocks are unrotated boxes. A base
 * sits on a surface when all four footprint corners lie in or on its XZ
 * polygon, by {@link worldSurfaceContains}, at the surface height within
 * 1e-6 m, and no notch of the polygon cuts the footprint. Route clearance is
 * judged in plan: each segment must miss every block footprint widened by half
 * the route's formation width, whatever the block's height. A landmark is on
 * walkable ground when a walkable surface contains its plan position, edge
 * included, and is by a route when its plan distance to some segment is at
 * most its radius plus half that route's formation width. The checks run in
 * that order and the first contradiction throws an `Error` naming it; later
 * ones are not reported.
 *
 * @param input.blocks Static world masses, as axis-aligned world boxes.
 * @param input.surfaces Terrain and floor surfaces that may support or hold.
 * @param input.routes Routes whose widened segments must clear every block.
 * @param input.landmarks Points of interest that must be reachable.
 *
 * @evidence contracts/common.md#principled-implementation Block overlap is the strict axis-aligned box interval test, so touching faces pass; support is corner containment plus the fact that a notch of a simple polygon cutting a rectangle must put a vertex strictly inside it or properly cross one of its edges; route clearance is the Liang-Barsky slab clip of each segment against the padded footprint; landmark reach is plan point-to-segment distance.
 * @evidence contracts/common.md#clear-and-simple-design One gate owns world-layout contradictions; footprint containment is the shared `worldSurfaceContains` the ground oracle also reads, proper crossing is the architecture `segmentsCross` predicate, and plan distance uses `closestPointOnSegmentXZ`, replacing the private copies this file kept.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No block kind, surface or landmark is special-cased; a landmark on a walkable edge passes by the same floor-edge rule the ground oracle applies, and the first contradiction is thrown rather than collected because the builder cannot proceed past any of them.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every rule, the units and axes, the box and plan assumptions, the support tolerance, the edge rule, the check order, and that only the first contradiction is reported.
 * @evidence contracts/performance.md#efficient-algorithms O(B² + B·S·n + R·B + L·(S·n + R)) for B blocks, S surfaces of up to n corners, R route segments and L landmarks; pairwise block tests and per-segment scans use no spatial index.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A one-shot gate over one world layout that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only per-test footprint corners and closest points and retains nothing; it returns nothing and throws on the first contradiction.
 */
export const assertWorldPlacements: (input: { /** Static world masses, as axis-aligned world boxes. */ blocks : readonly IAutoMovieWorldBlock [ ] ; /** Terrain and floor surfaces that may support a block or hold a landmark. */ surfaces : readonly IAutoMovieWorldSurface [ ] ; /** Routes whose segments, widened by half their formation width, must clear every block. */ routes : readonly IAutoMovieWorldRoute [ ] ; /** Points of interest that must be reachable from walkable ground or a route. */ landmarks : readonly IAutoMovieWorldLandmark [ ] ; }) => void = (input: {
  /** Static world masses, as axis-aligned world boxes. */
  blocks: readonly IAutoMovieWorldBlock[];

  /** Terrain and floor surfaces that may support a block or hold a landmark. */
  surfaces: readonly IAutoMovieWorldSurface[];

  /** Routes whose segments, widened by half their formation width, must clear every block. */
  routes: readonly IAutoMovieWorldRoute[];

  /** Points of interest that must be reachable from walkable ground or a route. */
  landmarks: readonly IAutoMovieWorldLandmark[];
}): void => {
  for (let left: number = 0; left < input.blocks.length; ++left)
    for (let right: number = left + 1; right < input.blocks.length; ++right)
      if (overlaps(input.blocks[left]!, input.blocks[right]!))
        throw new Error(
          `World blocks "${input.blocks[left]!.id}" and "${input.blocks[right]!.id}" overlap.`,
        );
  for (const block of input.blocks)
    if (
      input.surfaces.some((surface: IAutoMovieWorldSurface): boolean =>
        surfaceSupportsBlock(surface, block),
      ) === false
    )
      throw new Error(
        `World block "${block.id}" floats or lacks a supporting surface at its base.`,
      );
  for (const route of input.routes)
    for (let index: number = 1; index < route.waypoints.length; ++index)
      for (const block of input.blocks)
        if (
          segmentIntersectsBounds(
            route.waypoints[index - 1]!,
            route.waypoints[index]!,
            block.bounds,
            route.allowedFormationWidth / 2,
          )
        )
          throw new Error(
            `World route "${route.id}" is blocked by "${block.id}".`,
          );
  for (const landmark of input.landmarks) {
    const onWalkable: boolean = input.surfaces.some(
      (surface: IAutoMovieWorldSurface): boolean =>
        surface.walkable && worldSurfaceContains(surface, landmark.position),
    );
    const byRoute: boolean = input.routes.some(
      (route: IAutoMovieWorldRoute): boolean =>
        route.waypoints.slice(1).some(
          (point: IAutoMovieWorldRoute["waypoints"][number], index: number): boolean => {
            const nearest: IAutoMovieVector3 = closestPointOnSegmentXZ(
              landmark.position,
              route.waypoints[index]!,
              point,
            );
            return (
              Math.hypot(
                landmark.position.x - nearest.x,
                landmark.position.z - nearest.z,
              ) <=
              landmark.radius + route.allowedFormationWidth / 2
            );
          },
        ),
    );
    if (onWalkable === false && byRoute === false)
      throw new Error(
        `World landmark "${landmark.id}" is unreachable from walkable terrain and declared routes.`,
      );
  }
};

/** Whether two boxes share interior volume; touching faces do not count. */
const overlaps: (left: IAutoMovieWorldBlock, right: IAutoMovieWorldBlock) => boolean = (
  left: IAutoMovieWorldBlock,
  right: IAutoMovieWorldBlock,
): boolean =>
  left.bounds.min.x < right.bounds.max.x &&
  left.bounds.max.x > right.bounds.min.x &&
  left.bounds.min.y < right.bounds.max.y &&
  left.bounds.max.y > right.bounds.min.y &&
  left.bounds.min.z < right.bounds.max.z &&
  left.bounds.max.z > right.bounds.min.z;

/** Whether a surface carries a block's whole footprint at the block's base. */
const surfaceSupportsBlock: (surface: IAutoMovieWorldSurface, block: IAutoMovieWorldBlock) => boolean = (
  surface: IAutoMovieWorldSurface,
  block: IAutoMovieWorldBlock,
): boolean => {
  const footprint: { x: number; z: number }[] = [
    { x: block.bounds.min.x, z: block.bounds.min.z },
    { x: block.bounds.max.x, z: block.bounds.min.z },
    { x: block.bounds.max.x, z: block.bounds.max.z },
    { x: block.bounds.min.x, z: block.bounds.max.z },
  ];
  if (
    footprint.some(
      (point: { x: number; z: number }): boolean =>
        worldSurfaceContains(surface, point) === false ||
        Math.abs(worldSurfaceHeight(surface, point) - block.bounds.min.y) >
          SUPPORT_TOLERANCE,
    )
  )
    return false;

  // Four contained corners are insufficient for a concave surface whose notch
  // cuts through the block. A simple polygon has no holes, so a notch must
  // either put one of its vertices inside the rectangle or properly cross a
  // footprint edge.
  if (
    surface.polygon.some(
      (point: { x: number; z: number }): boolean =>
        point.x > block.bounds.min.x &&
        point.x < block.bounds.max.x &&
        point.z > block.bounds.min.z &&
        point.z < block.bounds.max.z,
    )
  )
    return false;
  const plan: (point: { x : number ; z : number }) => IAutoMoviePlanarPoint = (point: { x: number; z: number }): IAutoMoviePlanarPoint => ({
    x: point.x,
    y: point.z,
  });
  for (let index: number = 0; index < footprint.length; ++index)
    for (
      let surfaceIndex: number = 0;
      surfaceIndex < surface.polygon.length;
      ++surfaceIndex
    )
      if (
        segmentsCross(
          plan(footprint[index]!),
          plan(footprint[(index + 1) % footprint.length]!),
          plan(surface.polygon[surfaceIndex]!),
          plan(surface.polygon[(surfaceIndex + 1) % surface.polygon.length]!),
        )
      )
        return false;
  return true;
};

/**
 * Whether a plan segment enters a block footprint widened by `padding`, by
 * clipping the segment's parameter range against the X and Z slabs.
 */
const segmentIntersectsBounds: (from: { x : number ; z : number }, to: { x : number ; z : number }, bounds: IAutoMovieWorldBlock [ "bounds" ], padding: number) => boolean = (
  from: { x: number; z: number },
  to: { x: number; z: number },
  bounds: IAutoMovieWorldBlock["bounds"],
  padding: number,
): boolean => {
  let minimum: number = 0;
  let maximum: number = 1;
  for (const axis of ["x", "z"] as const) {
    const delta: number = to[axis] - from[axis];
    const low: number = bounds.min[axis] - padding;
    const high: number = bounds.max[axis] + padding;
    if (Math.abs(delta) <= Number.EPSILON) {
      if (from[axis] < low || from[axis] > high) return false;
      continue;
    }
    const first: number = (low - from[axis]) / delta;
    const second: number = (high - from[axis]) / delta;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
    if (minimum > maximum) return false;
  }
  return true;
};
