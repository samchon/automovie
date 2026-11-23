import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Shared ring identity and evolving cyclic points used by slit-walk planning.
 * IDs must remain stable and distinguish rings within one planner invocation.
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
