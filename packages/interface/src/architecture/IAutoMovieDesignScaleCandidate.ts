/**
 * One reading of how long a source unit is on the ground.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignScaleCandidate` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignScaleCandidate` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignScaleCandidate {
  /**
   * Stable candidate identity within the frame.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;
  /**
   * Metres per one source unit; strictly positive.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `metersPerUnit` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `metersPerUnit` for the narrative intent reference lineage system contract.
   */
  metersPerUnit: number;
  /**
   * Inclusive `[0, 1]` confidence in this reading.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `confidence` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `confidence` for the narrative intent reference lineage system contract.
   */
  confidence: number;
  /**
   * Where the reading came from, such as `scale-bar` or `dimension-string`.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `basis` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `basis` for the narrative intent reference lineage system contract.
   */
  basis: string;
}
