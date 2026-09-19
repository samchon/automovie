import { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/**
 * One attempted reading of one frame.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignAnalysis` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignAnalysis` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignAnalysis {
  /**
   * Stable analysis identity within the document.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * Frame this analysis read.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `frame` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `frame` for the narrative intent reference lineage system contract.
   */
  frame: string;

  /**
   * Open label of the reading attempted, such as `wall-centerline`.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `subject` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `subject` for the narrative intent reference lineage system contract.
   */
  subject: string;

  /**
   * Honest outcome of the attempt.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `outcome` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `outcome` for the narrative intent reference lineage system contract.
   */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
