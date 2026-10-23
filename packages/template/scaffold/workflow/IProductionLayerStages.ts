import type { ProductionStage } from "./ProductionStage";

/**
 * Independent naturalness stages for the two rendered layers.
 * Settings and treatments finish as construction documents.
 */
export interface IProductionLayerStages {
  /** The stage of `scripts` in this pass. */
  scripts: ProductionStage;

  /** The stage of `screenplay` in this pass. */
  screenplay: ProductionStage;
}
