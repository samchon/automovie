import {
  type IAutoMovieFootprint,
  IAutoMovieSurface,
} from "@automovie/interface";

import { footprintRing } from "./footprintRing";

/** Project a surface's outer ring and optional holes into one footprint record. */
export const surfaceFootprint: (
  surface: IAutoMovieSurface,
) => IAutoMovieFootprint = (
  surface: IAutoMovieSurface,
): IAutoMovieFootprint => ({
  outer: footprintRing(surface.polygon),
  holes: (surface.holes ?? []).map(footprintRing),
});
