import type { AuthoredLayer } from "./AuthoredLayer";
import type { AuthoredPass } from "./AuthoredPass";
import type { NarrativeScope } from "./NarrativeScope";
import type { ProductionStage } from "./ProductionStage";

/** Describes one work-specific duty answered once per complete layer. */
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
