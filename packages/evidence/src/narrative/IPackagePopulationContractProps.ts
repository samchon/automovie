import type { AuthoredLayer } from "./AuthoredLayer";
import type { NarrativeScope } from "./NarrativeScope";
import type { ProductionStage } from "./ProductionStage";

/**
 * Describes one work-specific duty answered once per complete layer.
 *
 * @evidence contracts/development/design.md#principled-representation The object represents one exact work obligation document and its owning populations, with pilot-only deferral separate from pass activation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One duty document and layer-stage map express once-per-layer obligations separately from per-H2 checklists.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts createPackagePopulationContract enforces exact obligation paths and pilot-only deferral; the interface adds no bypass.
 * @evidence contracts/development/common.md#meaningful-documentation Members state tracked obligation addressing, complete-population ownership and pilot-only deferral.
 */
export interface IPackagePopulationContractProps {
  /** One tracked work-contract document containing population H2 duties. */
  document: string;

  /** Layers whose complete populations answer the document. */
  layers: Partial<Record<AuthoredLayer, ProductionStage>>;

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
