import { IAutoMovieWorldLandmark, IAutoMovieWorldRoute, IAutoMovieWorldSurface } from "@automovie/interface";
import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { pointSegmentDistance } from "./math/pointSegmentDistance";

/**
 * Reject material world-layout contradictions before shot construction.
 *
 * Blocks may touch but not overlap; every base must sit on a declared surface;
 * routes must clear block footprints; every landmark must lie on a walkable
 * surface or within its declared radius of a route.
 *
 * @evidence requirements/map/deliverables-and-validation.md#map-environment-relation-validation Rejects overlapping or unsupported blocks, obstructed routes, and landmarks unreachable from declared terrain.
 * @evidence requirements/map/terrain-and-landforms.md#map-terrain-contact-boundary `assertWorldPlacements` rejects a block whose base does not contact the selected declared terrain height and rejects routes whose footprints intersect placed blocks.
 * @evidence requirements/map/deliverables-and-validation.md#map-geometry-topology-validation The validator checks block overlap, terrain support, route clearance, and landmark reachability on the canonical world geometry before shot construction.
 * @evidence specifications/world-and-site/delivery-and-validation.md#world-site-environment-relation-validation Checks support, contact, clearance, and traversal relationships against the same canonical world records.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-terrain-modification-contact The placement gate compares each block base with the actual supporting surface height and preserves touching boundaries as valid contact.
 * @evidence specifications/world-and-site/delivery-and-validation.md#world-site-geometry-topology-validation The gate returns only after all declared placement, support, clearance, and reachability relations are geometrically consistent.
 */
export const assertWorldPlacements = (input: {
  blocks: readonly IAutoMovieWorldBlock[];
  surfaces: readonly IAutoMovieWorldSurface[];
  routes: readonly IAutoMovieWorldRoute[];
  landmarks: readonly IAutoMovieWorldLandmark[];
}): void => {
  for (let left = 0; left < input.blocks.length; ++left)
    for (let right = left + 1; right < input.blocks.length; ++right)
      if (overlaps(input.blocks[left]!, input.blocks[right]!))
        throw new Error(
          `World blocks "${input.blocks[left]!.id}" and "${input.blocks[right]!.id}" overlap.`,
        );
  for (const block of input.blocks) {
    if (
      input.surfaces.some((surface) => surfaceSupportsBlock(surface, block)) ===
      false
    )
      throw new Error(
        `World block "${block.id}" floats or lacks a supporting surface at its base.`,
      );
  }
  for (const route of input.routes)
    for (let index = 1; index < route.waypoints.length; ++index)
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
    const onWalkable = input.surfaces.some(
      (surface) =>
        surface.walkable && insidePolygon(landmark.position, surface.polygon),
    );
    const byRoute = input.routes.some((route) =>
      route.waypoints
        .slice(1)
        .some(
          (point, index) =>
            pointSegmentDistance(
              landmark.position,
              route.waypoints[index]!,
              point,
            ) <=
            landmark.radius + route.allowedFormationWidth / 2,
        ),
    );
    if (onWalkable === false && byRoute === false)
      throw new Error(
        `World landmark "${landmark.id}" is unreachable from walkable terrain and declared routes.`,
      );
  }
};
