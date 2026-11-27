import type {
  IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { readSurfaceHeight } from "./readSurfaceHeight";
import { selectGroundSurface } from "./selectGroundSurface";

/*
 * Read the selected world terrain height, retaining null for absent support.
 */
export function readGroundHeight(
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
): number | null {
  const surface: IAutoMovieWorldSurface | null = selectGroundSurface(
    surfaces,
    point,
  );
  return surface === null ? null : readSurfaceHeight(surface, point);
}
