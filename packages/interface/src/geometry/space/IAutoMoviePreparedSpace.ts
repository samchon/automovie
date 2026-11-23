import type { IAutoMovieSpace } from "../../scene/IAutoMovieSpace";
import type { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/** Prepared footprint index for all surfaces in a space. */
export interface IAutoMoviePreparedSpace {
  /** The source space this prepared index was built from. */
  readonly space: IAutoMovieSpace;

  /**
   * Prepared authored rings and holes, preserving concavity rather than taking
   * convex hulls.
   */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
