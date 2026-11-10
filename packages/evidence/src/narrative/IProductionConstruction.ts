import type { ProductionStage } from "./ProductionStage";

/**
 * Selects each layer's construction stage and its native parent references.
 *
 * @evidence contracts/development/design.md#principled-representation The stage object selects route-specific construction claims and a long-route outline override; native references carry the actual parents, while independent review judges their completion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar layer stages and the optional outline override express the actual construction chain without an alternate scripts edition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime source validation rejects invalid stages and unsupported tuples rather than treating the interface as proof of validity.
 * @evidence contracts/development/common.md#meaningful-documentation Members define the long-route outline fallback, the optional short-route brief and actual screenplay prerequisites for all three narrative routes.
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

  /** Settings is the long route's source layer and has no upstream references. */
  settings: ProductionStage;

  /**
   * Sets the short route's brief construction stage.
   *
   * The brief is the short route's source layer and has no upstream references.
   * Omitted, it is disabled.
   */
  brief?: ProductionStage;

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
   * Short productions require approved brief construction, and compact
   * short productions approved settings construction.
   */
  screenplay: ProductionStage;
}
