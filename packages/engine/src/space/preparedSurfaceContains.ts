import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";
import { footprintContains } from "./footprintContains";

/**
 * Is `(x, z)` on a prepared surface footprint?
 *
 * @author Samchon
 */
export const preparedSurfaceContains = (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
): boolean => footprintContains(prepared.footprint, x, z);
