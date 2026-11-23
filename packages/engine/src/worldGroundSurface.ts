import {
  type IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { worldSurfaceContains } from "./worldSurfaceContains";

/** Select the first declared world surface containing an XZ point. */
export const worldGroundSurface: (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
) => IAutoMovieWorldSurface | null = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
): IAutoMovieWorldSurface | null =>
  surfaces.find((surface: IAutoMovieWorldSurface): boolean =>
    worldSurfaceContains(surface, point),
  ) ?? null;
