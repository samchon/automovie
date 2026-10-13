import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Prepared footprint index for all surfaces in a space.
 *
 * @author Samchon
 */
export interface IAutoMoviePreparedSpace {
  /** The source space this prepared index was built from. */
  readonly space: IAutoMovieSpace;

  /** Surface footprints with precomputed convex hulls. */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
