import type { AuthoredLayer } from "./AuthoredLayer";
import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";
import type { AutoMovieEvidenceProductionStage } from "./AutoMovieEvidenceProductionStage";

/** Describes one work-specific duty answered once per complete layer. */
export interface IPackagePopulationContractProps {
  /** One tracked work-contract document containing population H2 duties. */
  document: string;

  /** Layers whose complete populations answer the document. */
  layers: Partial<Record<AuthoredLayer, AutoMovieEvidenceProductionStage>>;

  /**
   * Selects the exact narrative population whose documents answer the duty.
   *
   * The document that realizes each item cites it once at file level.
   */
  narrativeScope: AutoMovieEvidenceNarrativeScope;

  /** States what the population obligation must establish. */
  reason: string;

  /** Defers a complete-work obligation while only a pilot is selected. */
  inapplicable?: boolean;
}
