import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * One cyclic ring shared by preparation and resolution. Keep its identity
 * unique and stable throughout the planner invocation.
 */
export interface IAutoMoviePlanContourWalks64Ring {
  /**
   * Stable unique ring name used in the ordered selection's cache key; changing
   * it invalidates prepared walk lookup.
   */
  id: string;

  /**
   * Shared cyclic millimetre samples refined during preparation. Finish all
   * edits before resolution, which caches source identity-to-index maps.
   */
  points: AutoMovieVector3Tuple[];
}
