import { IAutoMovieWorldSurface } from "@automovie/interface";
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
