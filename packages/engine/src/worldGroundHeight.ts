import { IAutoMovieVector3, IAutoMovieWorldSurface } from "@automovie/interface";
import { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import { worldGroundSurface } from "./worldGroundSurface";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/**
 * Height of the world terrain under an XZ point, or `null` over nothing.
 *
 * @evidence requirements/map/terrain-and-landforms.md#map-elevation-slope Returns the declared terrain elevation below an XZ point while preserving the absence of ground as `null`.
 * @evidence requirements/map/terrain-and-landforms.md#map-terrain-gap `worldGroundHeight` returns `null` when no declared surface contains the point, keeping missing terrain distinct from an invented zero elevation.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-elevation-slope-surface-input Joins footprint selection and the shared height rule so placement and terrain queries read one surface record.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-terrain-resolution-gap The ground query exposes an explicit gap outside every declared footprint instead of extrapolating the nearest heightfield.
 */
export const worldGroundHeight = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): number | null => {
  const surface = worldGroundSurface(surfaces, point);
  return surface === null ? null : worldSurfaceHeight(surface, point);
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

const assertText = (value: string, field: string): void => {
  if (value.trim().length === 0)
    throw new Error(`${field} must contain non-whitespace text.`);
};

const assertVector = (value: IAutoMovieVector3, field: string): void => {
  if ([value.x, value.y, value.z].every(Number.isFinite) === false)
    throw new Error(`${field} must be finite.`);
};

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
