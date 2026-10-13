/**
 * The bounded cost a planting recipe and its cluster add to a shot.
 *
 * Every field is derived from the records alone, so a production can be refused
 * for an unaffordable green wall before a single branch is grown.
 */
export interface IAutoMoviePlantingBudget {
  /** Identity of the measured recipe. */
  domain: string;

  /** Branch segments a fully grown, unpruned structure would emit. */
  worstCaseBranches: number;

  /**
   * Leaf occurrences a fully grown, unpruned structure would emit, or `0` for a
   * recipe with no foliage rule.
   *
   * Derived from the density rule and the branching law rather than read off
   * {@link maxLeaves}: a cap is what the recipe promises not to exceed, not what
   * it costs, and a bare winter branch that reported its cap would hand a
   * render budget a bill for foliage nobody grows.
   */
  worstCaseLeaves: number;

  /** Declared branch cap. */
  maxBranches: number;

  /** Declared leaf cap. */
  maxLeaves: number;

  /** Cluster members requested, or `1` when the recipe stands alone. */
  members: number;

  /** Worst-case branch instances the renderer would draw over every member. */
  worstCaseBranchInstances: number;

  /** Worst-case leaf instances the renderer would draw over every member. */
  worstCaseLeafInstances: number;
}
