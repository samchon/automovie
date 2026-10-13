import { IAutoMovieWorldSurface } from "@automovie/interface";

import { worldGroundSurface } from "./worldGroundSurface";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/** Height of the world terrain under an XZ point, or `null` over nothing. */
export const worldGroundHeight = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): number | null => {
  const surface = worldGroundSurface(surfaces, point);
  return surface === null ? null : worldSurfaceHeight(surface, point);
};
