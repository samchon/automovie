/**
 * One reading that produced nothing, reported rather than omitted.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignSkippedAnalysis` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignSkippedAnalysis` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignSkippedAnalysis {
  /**
   * Analysis that produced no reading.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `analysis` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `analysis` for the narrative intent reference lineage system contract.
   */
  analysis: string;

  /**
   * Which kind of nothing it produced.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `status` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `status` for the narrative intent reference lineage system contract.
   */
  status: "unsupported" | "not-run";

  /**
   * The analysis' own reason, carried through verbatim.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `reason` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `reason` for the narrative intent reference lineage system contract.
   */
  reason: string;
}
