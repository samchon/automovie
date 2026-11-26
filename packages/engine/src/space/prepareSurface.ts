import {
  type IAutoMoviePreparedSurface,
  IAutoMovieSurface,
} from "@automovie/interface";

import { AutoMovieEngineSpace } from "./AutoMovieEngineSpace";

/** Prepare one borrowed surface and its actual outer-and-hole footprint. */
export const prepareSurface: (
  surface: IAutoMovieSurface,
) => IAutoMoviePreparedSurface = (
  surface: IAutoMovieSurface,
): IAutoMoviePreparedSurface => ({
  surface,
  footprint: AutoMovieEngineSpace.surfaceFootprint(surface),
});
