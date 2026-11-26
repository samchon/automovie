import type {
  IAutoMovieGroundQueryPoint,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { surfaceContainsPoint } from "./surfaceContainsPoint";

/** Select the first declared world surface containing an XZ point. */
export function selectGroundSurface(
  surfaces: readonly IAutoMovieWorldSurface[],
  point: IAutoMovieGroundQueryPoint,
): IAutoMovieWorldSurface | null {
  return (
    surfaces.find((surface: IAutoMovieWorldSurface): boolean =>
      surfaceContainsPoint(surface.polygon, point),
    ) ?? null
  );
}
