import type { AuthoredLayer } from "./AuthoredLayer";
import type { AuthoredPass } from "./AuthoredPass";
import type { NarrativeScope } from "./NarrativeScope";
import type { ProductionStage } from "./ProductionStage";

/**
 * Describes one work-specific duty answered once per complete layer.
 *
 * @evidence contracts/common.md#principled-implementation The object represents one exact work obligation document and its owning populations, with pilot-only deferral separate from pass activation.
 * @evidence contracts/common.md#clear-and-simple-design One duty document and layer-stage map express once-per-layer obligations separately from per-H2 checklists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts createPackagePopulationContract enforces exact obligation paths and pilot-only deferral; the interface adds no bypass.
 * @evidence contracts/common.md#meaningful-documentation Members state tracked obligation addressing, complete-population ownership, final-pass working roots and pilot-only deferral.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Whole-population contract inputs is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Whole-population contract inputs declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Whole-population contract inputs acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IPackagePopulationContractProps {
  /** One tracked work-contract document containing population H2 duties. */
  document: string;

  /** Layers whose complete populations answer the document. */
  layers: Partial<Record<AuthoredLayer, ProductionStage>>;

  /**
   * Selects which logical pass answers: `draft` for construction,
   * `final` for naturalness. Construction selects body; naturalness selects the working text.
   *
   * @default "draft"
   */
  pass?: AuthoredPass;

  /**
   * Selects the exact narrative population whose documents answer the duty.
   *
   * The document that realizes each item cites it once at file level.
   */
  narrativeScope: NarrativeScope;

  /** States what the population obligation must establish. */
  reason: string;

  /** Defers a complete-work obligation while only a pilot is selected. */
  inapplicable?: boolean;
}
