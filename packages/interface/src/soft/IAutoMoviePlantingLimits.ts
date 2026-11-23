/** Explicit branch and leaf population caps for one planting recipe. */
export interface IAutoMoviePlantingLimits {
  /** Branch segments this recipe may emit; a positive integer. */
  maxBranches: number;

  /** Leaf occurrences this recipe may emit; a non-negative integer. */
  maxLeaves: number;
}
