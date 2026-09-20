import { IAutoMovieSurface } from "@automovie/interface";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintRing } from "./footprintRing";

/**
 * The plan region one support surface covers.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `surfaceFootprint` produces the plan region one support surface covers. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surfaceFootprint` performs footprint surface evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const surfaceFootprint = (
  surface: IAutoMovieSurface,
): IAutoMovieFootprint => ({
  outer: footprintRing(surface.polygon),
  holes: (surface.holes ?? []).map(footprintRing),
});
