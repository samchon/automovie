import type { ProductionConstructionStageMixin } from "./ProductionConstructionStageMixin";
import type { ProductionStage } from "./ProductionStage";

/**
 * Sets each layer's construction stage and upstream approval dependency.
 *
 * @evidence contracts/common.md#principled-implementation The stage object models four construction layers plus independently staged settings outline; the screenplay tuple alone chooses scripts construction versus naturalness as its prerequisite.
 * @evidence contracts/common.md#clear-and-simple-design Documentary stages and the optional outline override remain separate from the one screenplay scripts-source tuple.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime source validation rejects invalid stages and unsupported tuples rather than treating the interface as proof of validity.
 * @evidence contracts/common.md#meaningful-documentation Members define outline fallback, documentary prerequisites and bare-stage versus tuple scripts approval behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction stage selection is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Construction stage selection declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Construction stage selection acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionConstruction {
  /**
   * Sets the settings outline document's own construction stage.
   *
   * The outline's part principle and arrangement obligation claims follow this
   * stage, so the outline's evidence can open or close apart from the settings
   * files. The file-to-outline-entry claim stays on the settings stage.
   * Omitted, the outline follows the settings stage.
   */
  index?: ProductionStage;

  /** Settings is the source layer and has no upstream references. */
  settings: ProductionStage;

  /**
   * Sets the treatments construction stage.
   *
   * Requires the approved settings construction.
   */
  treatments: ProductionStage;

  /**
   * Sets the scripts construction stage.
   *
   * Requires the approved treatments construction.
   */
  scripts: ProductionStage;

  /**
   * Sets the screenplay construction stage.
   *
   * The tuple is [stage, useFinalScripts]. True requires scripts naturalness,
   * false scripts construction. Both require treatments construction and read
   * the current body. A stage string alone means true.
   */
  screenplay: ProductionStage | ProductionConstructionStageMixin;
}
