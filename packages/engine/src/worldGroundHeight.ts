import {
  type IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { worldGroundSurface } from "./worldGroundSurface";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/** Read the selected world terrain height, retaining null for absent support. */
export const worldGroundHeight: (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
) => number | null = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
): number | null => {
  const surface: IAutoMovieWorldSurface | null = worldGroundSurface(
    surfaces,
    point,
  );
  return surface === null ? null : worldSurfaceHeight(surface, point);
};
