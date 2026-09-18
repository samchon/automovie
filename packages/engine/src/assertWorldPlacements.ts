import { IAutoMovieWorldLandmark, IAutoMovieWorldRoute, IAutoMovieWorldSurface } from "@automovie/interface";
import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

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

const overlaps = (
  left: IAutoMovieWorldBlock,
  right: IAutoMovieWorldBlock,
): boolean =>
  left.bounds.min.x < right.bounds.max.x &&
  left.bounds.max.x > right.bounds.min.x &&
  left.bounds.min.y < right.bounds.max.y &&
  left.bounds.max.y > right.bounds.min.y &&
  left.bounds.min.z < right.bounds.max.z &&
  left.bounds.max.z > right.bounds.min.z;

const insidePolygon = (
  point: { x: number; z: number },
  polygon: IAutoMovieWorldSurface["polygon"],
): boolean => {
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const current = polygon[index]!;
    const prior = polygon[previous]!;
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

const surfaceSupportsBlock = (
  surface: IAutoMovieWorldSurface,
  block: IAutoMovieWorldBlock,
): boolean => {
  const footprint = [
    { x: block.bounds.min.x, z: block.bounds.min.z },
    { x: block.bounds.max.x, z: block.bounds.min.z },
    { x: block.bounds.max.x, z: block.bounds.max.z },
    { x: block.bounds.min.x, z: block.bounds.max.z },
  ];
  if (
    footprint.some(
      (point) =>
        insideOrOnPolygon(point, surface.polygon) === false ||
        Math.abs(worldSurfaceHeight(surface, point) - block.bounds.min.y) >
          1e-6,
    )
  )
    return false;

  // Four contained corners are insufficient for a concave surface whose notch
  // cuts through the block. A simple polygon has no holes, so a notch must
  // either put one of its vertices inside the rectangle or properly cross a
  // footprint edge.
  if (
    surface.polygon.some(
      (point) =>
        point.x > block.bounds.min.x &&
        point.x < block.bounds.max.x &&
        point.z > block.bounds.min.z &&
        point.z < block.bounds.max.z,
    )
  )
    return false;
  for (let index = 0; index < footprint.length; ++index) {
    const blockFrom = footprint[index]!;
    const blockTo = footprint[(index + 1) % footprint.length]!;
    for (
      let surfaceIndex = 0;
      surfaceIndex < surface.polygon.length;
      ++surfaceIndex
    )
      if (
        segmentsProperlyIntersect(
          blockFrom,
          blockTo,
          surface.polygon[surfaceIndex]!,
          surface.polygon[(surfaceIndex + 1) % surface.polygon.length]!,
        )
      )
        return false;
  }
  return true;
};

const insideOrOnPolygon = (
  point: { x: number; z: number },
  polygon: IAutoMovieWorldSurface["polygon"],
): boolean =>
  polygon.some(
    (current, index) =>
      pointSegmentDistance(
        point,
        current,
        polygon[(index + 1) % polygon.length]!,
      ) <= 1e-9,
  ) || insidePolygon(point, polygon);

const segmentsProperlyIntersect = (
  leftFrom: { x: number; z: number },
  leftTo: { x: number; z: number },
  rightFrom: { x: number; z: number },
  rightTo: { x: number; z: number },
): boolean => {
  const orient = (
    origin: { x: number; z: number },
    first: { x: number; z: number },
    second: { x: number; z: number },
  ): number =>
    (first.x - origin.x) * (second.z - origin.z) -
    (first.z - origin.z) * (second.x - origin.x);
  const leftA = orient(leftFrom, leftTo, rightFrom);
  const leftB = orient(leftFrom, leftTo, rightTo);
  const rightA = orient(rightFrom, rightTo, leftFrom);
  const rightB = orient(rightFrom, rightTo, leftTo);
  return leftA * leftB < -Number.EPSILON && rightA * rightB < -Number.EPSILON;
};

const segmentIntersectsBounds = (
  from: { x: number; z: number },
  to: { x: number; z: number },
  bounds: IAutoMovieWorldBlock["bounds"],
  padding: number,
): boolean => {
  let minimum = 0;
  let maximum = 1;
  for (const axis of ["x", "z"] as const) {
    const delta = to[axis] - from[axis];
    const low = bounds.min[axis] - padding;
    const high = bounds.max[axis] + padding;
    if (Math.abs(delta) <= Number.EPSILON) {
      if (from[axis] < low || from[axis] > high) return false;
      continue;
    }
    const first = (low - from[axis]) / delta;
    const second = (high - from[axis]) / delta;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
    if (minimum > maximum) return false;
  }
  return true;
};

const pointSegmentDistance = (
  point: { x: number; z: number },
  from: { x: number; z: number },
  to: { x: number; z: number },
): number => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  const ratio =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - from.x) * dx + (point.z - from.z) * dz) / lengthSquared,
          ),
        );
  return Math.hypot(
    point.x - (from.x + dx * ratio),
    point.z - (from.z + dz * ratio),
  );
};
