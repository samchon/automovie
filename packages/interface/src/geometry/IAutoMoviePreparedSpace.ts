import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import type { IAutoMoviePreparedSurface } from "./IAutoMoviePreparedSurface";

/**
 * Reusable footprints for the authored surfaces of one space, kept in their
 * original order.
 *
 * Preparation copies polygon coordinates into footprint records. Reuse those
 * records while the source footprints and authored surface ordering stay
 * stable.
 */
export interface IAutoMoviePreparedSpace {
  /**
   * The original space reference whose surfaces supplied the footprint
   * preparation. Use this prepared view with that space.
   */
  readonly space: IAutoMovieSpace;

  /**
   * One prepared footprint and source reference per authored surface, in source
   * order. Rebuild if a source polygon or its holes change.
   */
  readonly surfaces: readonly IAutoMoviePreparedSurface[];
}
