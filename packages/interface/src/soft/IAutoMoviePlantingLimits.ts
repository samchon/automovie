/** Hard caps a planting recipe promises to stay inside. */
export interface IAutoMoviePlantingLimits {
  /** Branch segments this recipe may emit; a positive integer. */
  maxBranches: number;

  /** Leaf occurrences this recipe may emit; a non-negative integer. */
  maxLeaves: number;
}
