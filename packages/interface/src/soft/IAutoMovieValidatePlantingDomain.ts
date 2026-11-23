import type { IAutoMoviePlantingDomain } from "./IAutoMoviePlantingDomain";

/** Typed planting growth recipe submitted for semantic admission. */
export namespace IAutoMovieValidatePlantingDomain {
  /**
   * Recipe for checking scalar growth rules, sibling child identities, pruning,
   * foliage and emission budgets. validatePlantingDomain checks version/metre
   * units and bounded levels before comparing plantingBudget's unpruned
   * population estimates to declared caps. It reports violations without
   * changing the recipe or emitting a tree; violations can retain authored
   * values.
   *
   * Typed containers must already exist or property access can throw. Finite
   * scalar admission does not prove finite derived geometry; direct squared
   * direction tests can classify tiny nonzero directions as zero. This request
   * owns no animation clock or growth history: growth.stage is the recipe's
   * supplied dimensionless state.
   */
  export type IProps = {
    /**
     * Structurally present recipe to inspect, including its own branch/leaf
     * caps; it remains unchanged even when rejected.
     */
    domain: IAutoMoviePlantingDomain;
  };
}
