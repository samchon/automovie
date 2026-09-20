import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * The world terrain under an XZ point, or `null` where the world has none.
 *
 * The first declared surface containing the point wins, which is the answer the
 * ground oracle already reported and therefore the one an author has been
 * composing against: a terraced square states its steps in the order it wants
 * them read. A point exactly on a footprint edge is on that surface, because
 * the edge of a floor is still floor and a strict reading would drop the
 * outermost rank of a unit sized to its own ground.
 *
 * The height that goes with it is {@link worldSurfaceHeight} of the same record.
 * Both answers come from here so a placement, a gate and an oracle cannot each
 * pick a different surface.
 *
 * @evidence requirements/map/terrain-and-landforms.md#map-elevation-slope Selects the authored terrain surface whose footprint contains the queried XZ point, including its boundary.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-elevation-slope-surface-input Resolves ground membership from ordered explicit footprints before any elevation is sampled.
 */
export const worldGroundSurface = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): IAutoMovieWorldSurface | null =>
  surfaces.find((surface) => insideOrOnPolygon(point, surface.polygon)) ?? null;

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
