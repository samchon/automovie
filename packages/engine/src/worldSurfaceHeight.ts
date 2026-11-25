import {
  type IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { surfaceHeightAt } from "./space/surfaceHeightAt";

/** Evaluate one world surface's height rule at XZ without testing its footprint. */
export const worldSurfaceHeight: (
  surface: IAutoMovieWorldSurface,
  point: IAutoMovieGroundQueryPoint,
) => number = (
  surface: IAutoMovieWorldSurface,
  point: IAutoMovieGroundQueryPoint,
): number => surfaceHeightAt(surface, point.x, point.z);
