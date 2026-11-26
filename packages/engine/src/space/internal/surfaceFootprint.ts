import {
  type IAutoMovieFootprint,
  IAutoMovieSurface,
} from "@automovie/interface";

import { AutoMovieEngineSpace } from "../AutoMovieEngineSpace";

/** Project a surface's outer ring and optional holes into one footprint record. */
export const surfaceFootprint: (
  surface: IAutoMovieSurface,
) => IAutoMovieFootprint = (
  surface: IAutoMovieSurface,
): IAutoMovieFootprint => ({
  outer: AutoMovieEngineSpace.footprintRing(surface.polygon),
  holes: (surface.holes ?? []).map(AutoMovieEngineSpace.footprintRing),
});
