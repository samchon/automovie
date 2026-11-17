import type { IAutoMoviePlantingDomain } from "./IAutoMoviePlantingDomain";

/** Typed planting growth recipe submitted for semantic admission. */
export namespace IAutoMovieValidatePlantingDomain {
  /**
   * Recipe for checking scalar growth rules, sibling child identities, pruning, foliage and emission budgets. validatePlantingDomain checks version/metre units and bounded levels before comparing plantingBudget's unpruned population estimates to declared caps. It reports violations without changing the recipe or emitting a tree; violations can retain authored values.
   *
   * Typed containers must already exist or property access can throw. Finite scalar admission does not prove finite derived geometry; direct squared direction tests can classify tiny nonzero directions as zero. This request owns no animation clock or growth history: growth.stage is the recipe's supplied dimensionless state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the rule groups, shared budget comparison, unchanged input, typed-container premise and numerical limits.
   * @evidence contracts/development/design.md#principled-representation Reuses the canonical metre-based local recipe with dimensionless growth and branching ratios; validatePlantingDomain owns numeric, identity and cap checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The single domain request serves installation validation and lowering through the same recipe gate and plantingBudget count owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No tree sample substitutes for upper population admission and no returned success claims universal finite geometry.
   */
  export type IProps = {
    /** Structurally present recipe to inspect, including its own branch/leaf caps; it remains unchanged even when rejected. */
    domain: IAutoMoviePlantingDomain;
  };
}
