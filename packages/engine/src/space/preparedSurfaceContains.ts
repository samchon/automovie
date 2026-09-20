import { footprintContains } from "./footprintContains";
import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Is `(x, z)` on a prepared surface footprint?
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `preparedSurfaceContains` answers "Is `(x, z)` on a prepared surface footprint?" This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `preparedSurfaceContains` tests a prepared surface's cached footprint for the queried plan point.
 * @author Samchon
 */
export const preparedSurfaceContains = (
  prepared: IAutoMoviePreparedSurface,
  x: number,
  z: number,
): boolean => footprintContains(prepared.footprint, x, z);
