import type { ProductionStage } from "./ProductionStage";

/**
 * The independent naturalness stage of final screenplay.
 * Settings, treatments and scripts finish within construction; scripts
 * construction also answers its expression questions.
 *
 * @evidence contracts/development/design.md#principled-representation Only screenplay has a separate expression stage; scripts construction owns its expression questions, and documentary layers finish within construction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One field represents the actual revision pass without a frozen script-content cycle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The factory checks stage values; the type supplies no disabled-check compensation or special consumer path.
 * @evidence contracts/development/common.md#meaningful-documentation The prose identifies construction-only layers and the screenplay naturalness stage.
 */
export interface IProductionLayerStages {
  /** The stage of `screenplay` in this pass. */
  screenplay: ProductionStage;
}
