/**
 * The bounded cost a planting recipe and its cluster add to a shot.
 *
 * Every field is derived from the records alone, so a production can be refused
 * for an unaffordable green wall before a single branch is grown.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePlantingBudget` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingBudget` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingBudget {
  /**
   * Identity of the measured recipe.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `domain` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `domain` for the interior space soft furnishing planting system contract.
   */
  domain: string;

  /**
   * Branch segments a fully grown, unpruned structure would emit.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `worstCaseBranches` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `worstCaseBranches` for the interior space soft furnishing planting system contract.
   */
  worstCaseBranches: number;

  /**
   * Leaf occurrences a fully grown, unpruned structure would emit, or `0` for a
   * recipe with no foliage rule.
   *
   * Derived from the density rule and the branching law rather than read off
   * {@link maxLeaves}: a cap is what the recipe promises not to exceed, not what
   * it costs, and a bare winter branch that reported its cap would hand a
   * render budget a bill for foliage nobody grows.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `worstCaseLeaves` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `worstCaseLeaves` for the interior space soft furnishing planting system contract.
   */
  worstCaseLeaves: number;

  /**
   * Declared branch cap.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `maxBranches` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `maxBranches` for the interior space soft furnishing planting system contract.
   */
  maxBranches: number;

  /**
   * Declared leaf cap.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `maxLeaves` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `maxLeaves` for the interior space soft furnishing planting system contract.
   */
  maxLeaves: number;

  /**
   * Cluster members requested, or `1` when the recipe stands alone.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `members` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `members` for the interior space soft furnishing planting system contract.
   */
  members: number;

  /**
   * Worst-case branch instances the renderer would draw over every member.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `worstCaseBranchInstances` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `worstCaseBranchInstances` for the interior space soft furnishing planting system contract.
   */
  worstCaseBranchInstances: number;

  /**
   * Worst-case leaf instances the renderer would draw over every member.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `worstCaseLeafInstances` as the portable data boundary for the interior plant placement state requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `worstCaseLeafInstances` for the interior space soft furnishing planting system contract.
   */
  worstCaseLeafInstances: number;
}
