import {
  type IAutoMoviePreparedSurface,
  IAutoMovieSurface,
} from "@automovie/interface";

import { surfaceFootprint } from "./surfaceFootprint";

/** Prepare one borrowed surface and its actual outer-and-hole footprint. */
export const prepareSurface: (
  surface: IAutoMovieSurface,
) => IAutoMoviePreparedSurface = (
  surface: IAutoMovieSurface,
): IAutoMoviePreparedSurface => ({
  surface,
  footprint: surfaceFootprint(surface),
});
