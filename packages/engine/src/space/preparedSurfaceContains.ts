import type { IAutoMoviePreparedSurface } from "@automovie/interface";

import { AutoMovieEngineSpace } from "./AutoMovieEngineSpace";

/** Query membership in an already prepared surface footprint. */
export const preparedSurfaceContains: (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
) => boolean = (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
): boolean => AutoMovieEngineSpace.footprintContains(prepared.footprint, x, z);
