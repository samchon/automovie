import type { ProductionStage } from "./ProductionStage";

/**
 * Independent naturalness stages for the two rendered layers.
 * Settings and treatments finish as construction documents.
 *
 * @evidence contracts/common.md#principled-implementation Only scripts and screenplay have expression stages, so the object excludes documentary settings and treatments instead of inventing unused revision phases.
 * @evidence contracts/common.md#clear-and-simple-design Only two fields represent actual expression passes, avoiding artificial documentary revision states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory checks stage values; the type supplies no disabled-check compensation or special consumer path.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies construction-only documentary layers and independent rendered-layer naturalness stages.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Naturalness activation stages is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Naturalness activation stages declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Naturalness activation stages acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionLayerStages {
  /** The stage of `scripts` in this pass. */
  scripts: ProductionStage;

  /** The stage of `screenplay` in this pass. */
  screenplay: ProductionStage;
}
