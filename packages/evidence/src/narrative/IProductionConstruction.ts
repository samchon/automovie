import type { ProductionStage } from "./ProductionStage";

/**
 * Sets each layer's construction stage and upstream approval dependency.
 *
 * @evidence contracts/common.md#principled-implementation The stage object supplies route-selected construction layers and a long-route outline override; long screenplay requires scripts and treatments, compact screenplay requires settings, and direct short screenplay has no invented parents.
 * @evidence contracts/common.md#clear-and-simple-design Scalar layer stages and the optional outline override express the actual construction chain without an alternate scripts edition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime source validation rejects invalid stages and unsupported tuples rather than treating the interface as proof of validity.
 * @evidence contracts/common.md#meaningful-documentation Members define the long-route outline fallback and actual screenplay prerequisites for all three narrative routes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction stage selection is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Construction stage selection declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Construction stage selection acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionConstruction {
  /**
   * Sets the long-route settings outline document's own construction stage.
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
   * Requires approved scripts and treatments construction in long productions.
   * Compact short productions require approved settings construction.
   * Direct short productions enter without invented parents.
   */
  screenplay: ProductionStage;
}
