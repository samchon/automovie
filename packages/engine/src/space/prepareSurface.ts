import { IAutoMovieSurface } from "@automovie/interface";
import { surfaceFootprint } from "./surfaceFootprint";
import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Precompute one surface footprint hull for repeated point queries.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `prepareSurface` precomputes one surface footprint hull for repeated point queries. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `prepareSurface` performs surface preparation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export const prepareSurface = (
  surface: IAutoMovieSurface,
): IAutoMoviePreparedSurface => ({
  surface,
  footprint: surfaceFootprint(surface),
});
