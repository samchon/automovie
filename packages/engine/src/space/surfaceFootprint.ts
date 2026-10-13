import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintRing } from "./footprintRing";

/** The plan region one support surface covers. */
export const surfaceFootprint = (
  surface: IAutoMovieSurface,
): IAutoMovieFootprint => ({
  outer: footprintRing(surface.polygon),
  holes: (surface.holes ?? []).map(footprintRing),
});
