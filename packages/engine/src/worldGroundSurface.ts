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
