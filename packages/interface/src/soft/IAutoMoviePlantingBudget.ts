/**
 * The bounded cost a planting recipe and its cluster add to a shot.
 *
 * Every field is derived from the records alone, so a production can be refused for an unaffordable green wall before a single branch is grown.
 *
 * @evidence contracts/common.md#principled-implementation plantingBudget walks the admitted branching depth and maximum length-jitter law, summing complete-tree branches and density-derived worst-case leaves before multiplying by requested cluster members.
 * @evidence contracts/common.md#clear-and-simple-design Derived worst-case demand remains separate from authored branch/leaf caps so validation compares a recipe's actual bound with its declared affordability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Leaf cost is not copied from maxLeaves and bare foliage has zero leaves; admitted depth bounds are a premise so an unbounded declared tree cannot exhaust the budget computation itself.
 * @evidence contracts/common.md#meaningful-documentation Defines recipe attribution, unpruned full-growth bounds, declared caps and standalone-versus-cluster member multiplication.
 * @author Samchon
 */
export interface IAutoMoviePlantingBudget {
  /** Identity of the measured recipe. */
  domain: string;

  /** Branch segments a fully grown, unpruned structure would emit. */
  worstCaseBranches: number;

  /**
   * Leaf occurrences a fully grown, unpruned structure would emit, or `0` for a recipe with no foliage rule.
   *
   * Derived from the density rule and the branching law rather than read off {@link maxLeaves}: a cap is what the recipe promises not to exceed, not what it costs, and a bare winter branch that reported its cap would hand a render budget a bill for foliage nobody grows.
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
