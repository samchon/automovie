import { IAutoMoviePlanarPoint, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One closed ring of a footprint, with the plan projection and the signed area
 * the queries read.
 *
 * The planar copy is kept rather than derived per call: `spaceGround` is asked
 * per foot per frame, and mapping `(x, z)` to `(x, y)` inside that loop would
 * build one array per containment test.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `IAutoMovieFootprintRing` represents one closed ring of a footprint, with the plan projection and the signed area the queries read. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `IAutoMovieFootprintRing` structures one closed ring of a footprint, with the plan projection and the signed area the queries read for the system that resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export interface IAutoMovieFootprintRing {
  /**
   * The ring as authored, in world XZ.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `points` records `IAutoMovieFootprintRing`'s ring as authored, in world XZ. This ensures membership is judged from a subject footprint rather than a point.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `points` supplies `IAutoMovieFootprintRing`'s ring as authored, in world XZ when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly points: readonly IAutoMovieVector3[];

  /**
   * The same ring as `(x, y) = (x, z)`, for the planar predicates.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `plan` records `IAutoMovieFootprintRing`'s same ring as `(x, y) = (x, z)`, for the planar predicates. This ensures membership is judged from a subject footprint rather than a point.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `plan` supplies `IAutoMovieFootprintRing`'s same ring as `(x, y) = (x, z)`, for the planar predicates when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly plan: readonly IAutoMoviePlanarPoint[];

  /**
   * Twice the signed plan area, positive in {@link convexHull2D}'s own winding.
   * Zero means the ring encloses nothing at all.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `doubleArea` records `IAutoMovieFootprintRing`'s twice the signed plan area, positive in `convexHull2D`'s own winding. This ensures membership is judged from a subject footprint rather than a point.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `doubleArea` supplies `IAutoMovieFootprintRing`'s twice the signed plan area, positive in `convexHull2D`'s own winding when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly doubleArea: number;
}
