import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Borrowed saved-ring samples for correspondence. The planner uses the samples
 * for geometric separation scoring and compares declared winding. Retaining a
 * refused ring preserves the saved section's loop ordinals.
 */
export interface IAutoMoviePlanContourSlabs64Ring {
  /**
   * Cyclic model-millimetre samples in their saved order. Supported ring pairs
   * use these samples to score separation.
   */
  points: AutoMovieVector3Tuple[];

  /**
   * Declared material-boundary winding, compared for exact equality when
   * selecting continuation candidates.
   */
  winding: number;

  /**
   * Sampling or representation refusal; presence excludes this ring from
   * ordinary geometric matching while retaining its saved ordinal.
   */
  unsupported?: string;
}
