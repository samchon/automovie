import type { IAutoMoviePreparedSurface } from "@automovie/interface";

import { footprintContains } from "./footprintContains";

/** Query membership in an already prepared surface footprint. */
export const preparedSurfaceContains: (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
) => boolean = (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
): boolean => footprintContains(prepared.footprint, x, z);
