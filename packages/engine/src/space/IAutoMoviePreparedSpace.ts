import { IAutoMovieSpace } from "@automovie/interface";
import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Prepared footprint index for all surfaces in a space.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `IAutoMoviePreparedSpace` represents prepared footprint index for all surfaces in a space. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `IAutoMoviePreparedSpace` structures prepared footprint index for all surfaces in a space for the system that resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export interface IAutoMoviePreparedSpace {
  /**
   * The source space this prepared index was built from.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `space` records `IAutoMoviePreparedSpace`'s source space this prepared index was built from. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `space` supplies `IAutoMoviePreparedSpace`'s source space this prepared index was built from when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly space: IAutoMovieSpace;

  /**
   * Surface footprints with precomputed convex hulls.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `surfaces` records `IAutoMoviePreparedSpace`'s surface footprints with precomputed convex hulls. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surfaces` supplies `IAutoMoviePreparedSpace`'s surface footprints with precomputed convex hulls when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
