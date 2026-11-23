import type { IAutoMovieSubjectBox } from "../production/IAutoMovieSubjectBox";
import type { IAutoMovieBuiltPlacementBounds } from "./IAutoMovieBuiltPlacementBounds";

/**
 * One placed body resolved to its reported box and overlap proxy boxes.
 *
 * Produced by `resolveBuiltPlacementBody`. An element's `solids` are its part
 * boxes because the union can contain gaps; a population has no part split, so
 * its one `bounds` envelope is also its only solid proxy. These AABBs can
 * contain empty space and are not exact mesh occupancy. Every solid lies inside
 * `bounds`, making the union a safe prune before proxy comparison.
 */
export interface IAutoMovieBuiltPlacementBody {
  /** The body's reported world box, labelled with how it was derived. */
  bounds: IAutoMovieBuiltPlacementBounds;

  /**
   * World AABB proxies: one per drawn part for an element, or `[bounds]` for a
   * population. Never empty; proxies can include gaps and other empty space.
   */
  solids: readonly IAutoMovieSubjectBox[];
}
