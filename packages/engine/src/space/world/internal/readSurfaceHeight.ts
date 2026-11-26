import type {
  IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { surfaceHeightAt } from "../../surfaceHeightAt";

/** Evaluate one world surface's height rule at XZ without testing its footprint. */
export function readSurfaceHeight(
  surface: IAutoMovieWorldSurface,
  point: IAutoMovieGroundQueryPoint,
): number {
  return surfaceHeightAt(surface, point.x, point.z);
}
