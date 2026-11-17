import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Shared ring identity and evolving cyclic points used by slit-walk planning.
 * IDs must remain stable and distinguish rings within one planner invocation.
 *
 * @evidence contracts/development/design.md#principled-representation Identity keys select prepared walks independently of point coordinates; points use the common contour millimetre frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieContourWalks64 reads only id and points while its generic ring subtype preserves callback-owned source data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal coordinates do not merge ring identity; source-owner callbacks resolve inserted shared knots.
 * @evidence contracts/development/common.md#meaningful-documentation States stable IDs, mutable sample lifetime and the transition after preparation.
 */
export interface IAutoMoviePlanContourWalks64Ring {
  /** Stable unique ring name used in the ordered selection's cache key; changing it invalidates prepared walk lookup. */
  id: string;

  /** Shared cyclic millimetre samples refined during preparation. Finish all edits before resolution, which caches source identity-to-index maps. */
  points: AutoMovieVector3Tuple[];
}
