import type { ProductionConstructionStageMixin } from "./ProductionConstructionStageMixin";
import type { ProductionStage } from "./ProductionStage";

/** Sets each layer's construction stage and upstream approval dependency. */
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
