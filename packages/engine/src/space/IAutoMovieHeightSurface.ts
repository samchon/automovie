import { IAutoMovieHeightRule, IAutoMovieSurface, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Whatever states how high the ground is: either surface record answers here.
 *
 * A scene's {@link IAutoMovieSurface} and a production world's
 * `IAutoMovieWorldSurface` are two records for one thing, the ground, and both
 * are read by {@link surfaceHeightAt}. Spelled structurally rather than as a
 * union of the two so nothing has to name the world's record to ask its height,
 * and so a caller holding neither — a prepared patch, a projected footprint —
 * can still ask.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `IAutoMovieHeightSurface` represents whatever states how high the ground is: either surface record answers here. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `IAutoMovieHeightSurface` structures whatever states how high the ground is: either surface record answers here for the system that resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export interface IAutoMovieHeightSurface {
  /**
   * The general ground rule, when the surface states one.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `height` records `IAutoMovieHeightSurface`'s general ground rule, when the surface states one. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `height` supplies `IAutoMovieHeightSurface`'s general ground rule, when the surface states one when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly height?: IAutoMovieHeightRule | undefined;

  /**
   * First height anchor of the two-anchor spelling.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `anchor` records `IAutoMovieHeightSurface`'s first height anchor of the two-anchor spelling. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `anchor` supplies `IAutoMovieHeightSurface`'s first height anchor of the two-anchor spelling when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly anchor?: IAutoMovieVector3 | undefined;

  /**
   * Second height anchor of the two-anchor spelling; `null` when flat.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `rampTo` records `IAutoMovieHeightSurface`'s second height anchor of the two-anchor spelling; `null` when flat. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `rampTo` supplies `IAutoMovieHeightSurface`'s second height anchor of the two-anchor spelling; `null` when flat when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly rampTo?: IAutoMovieVector3 | null | undefined;
}
