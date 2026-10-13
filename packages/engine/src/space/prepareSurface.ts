import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";
import { surfaceFootprint } from "./surfaceFootprint";

/**
 * Precompute one surface footprint hull for repeated point queries.
 *
 * @author Samchon
 */
export const prepareSurface = (
  surface: IAutoMovieSurface,
): IAutoMoviePreparedSurface => ({
  surface,
  footprint: surfaceFootprint(surface),
});
