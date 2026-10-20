import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Prepared footprint index for all surfaces in a space.
 *
 * @evidence contracts/common.md#principled-implementation prepareSpace maps each source surface to its original ring-and-hole footprint; ground queries choose among those regions using the shared surface height function.
 * @evidence contracts/common.md#clear-and-simple-design One prepared collection supplies repeated point queries while keeping each source surface authoritative for identity, height and walkability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation does not replace concave regions with convex hulls or validate them; a caller passing a prepared record from another space can obtain inconsistent queries.
 * @evidence contracts/common.md#meaningful-documentation States source-space borrowing and prepared region storage; callers must rebuild after source polygon mutation and keep the prepared argument paired with its space.
 * @evidence contracts/performance.md#efficient-algorithms S surfaces with E total ring vertices need O(S+E) preparation time/storage; a query may scan all surfaces and their region edges.
 * @evidence contracts/performance.md#reuse-equivalent-work Explicit prepared arguments share completed projections/areas across queries; there is no global cache, source revision check or mutation watcher.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the prepared surface collection, which retains the source space/surfaces and their vertices until discarded; no renderer or background task is acquired.
 */
export interface IAutoMoviePreparedSpace {
  /** The source space this prepared index was built from. */
  readonly space: IAutoMovieSpace;

  /** Prepared authored rings and holes, preserving concavity rather than taking convex hulls. */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
