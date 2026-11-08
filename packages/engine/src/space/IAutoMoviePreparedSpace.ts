import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Prepared footprint index for all surfaces in a space.
 *
 * @evidence contracts/development/design.md#principled-representation prepareSpace maps each source surface to its original ring-and-hole footprint; ground queries choose among those regions using the shared surface height function.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared collection supplies repeated point queries while keeping each source surface authoritative for identity, height and walkability.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation does not replace concave regions with convex hulls or validate them; a caller passing a prepared record from another space can obtain inconsistent queries.
 * @evidence contracts/development/common.md#meaningful-documentation States source-space borrowing and prepared region storage; callers must rebuild after source polygon mutation and keep the prepared argument paired with its space.
 */
export interface IAutoMoviePreparedSpace {
  /** The source space this prepared index was built from. */
  readonly space: IAutoMovieSpace;

  /** Prepared authored rings and holes, preserving concavity rather than taking convex hulls. */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
