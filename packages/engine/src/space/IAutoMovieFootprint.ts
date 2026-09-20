import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";

/**
 * A surface's plan region: the outer ring, and the holes cut out of it.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `IAutoMovieFootprint` represents a surface's plan region: the outer ring, and the holes cut out of it. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `IAutoMovieFootprint` structures a surface's plan region: the outer ring, and the holes cut out of it for the system that resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export interface IAutoMovieFootprint {
  /**
   * The ring that bounds the region.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `outer` records `IAutoMovieFootprint`'s ring that bounds the region. This ensures membership is judged from a subject footprint rather than a point.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `outer` supplies `IAutoMovieFootprint`'s ring that bounds the region when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly outer: IAutoMovieFootprintRing;

  /**
   * Voids cut in {@link outer}; empty for a solid patch.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `holes` records `IAutoMovieFootprint`'s voids cut in `outer`; empty for a solid patch. This ensures membership is judged from a subject footprint rather than a point.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `holes` supplies `IAutoMovieFootprint`'s voids cut in `outer`; empty for a solid patch when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly holes: readonly IAutoMovieFootprintRing[];
}
