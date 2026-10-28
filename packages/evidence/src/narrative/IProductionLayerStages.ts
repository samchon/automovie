import type { ProductionStage } from "./ProductionStage";

/**
 * The independent naturalness stage of final screenplay.
 * Settings, treatments and scripts finish within construction; scripts
 * construction also answers its expression questions.
 *
 * @evidence contracts/common.md#principled-implementation Only screenplay has a separate expression stage; scripts construction owns its expression questions, and documentary layers finish within construction.
 * @evidence contracts/common.md#clear-and-simple-design One field represents the actual revision pass without a frozen script-content cycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory checks stage values; the type supplies no disabled-check compensation or special consumer path.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies construction-only layers and the screenplay naturalness stage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Naturalness activation stages is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Naturalness activation stages declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Naturalness activation stages acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionLayerStages {
  /** The stage of `screenplay` in this pass. */
  screenplay: ProductionStage;
}
