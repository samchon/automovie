/**
 * One comparison between alternatives, and the choice if it has been made.
 *
 * Selecting an option does not delete the others. The rejected alternatives
 * stay in the record with their changes and their reasons intact, because the
 * question "why not the other one" outlives the decision.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignDecision` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignDecision` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignDecision {
  /**
   * Stable decision identity within the lineage.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * What is being decided.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `question` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `question` for the narrative intent reference lineage system contract.
   */
  question: string;

  /**
   * Variant ids compared; at least two, all sharing one base revision.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `options` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `options` for the narrative intent reference lineage system contract.
   */
  options: string[];

  /**
   * Chosen option id, or null while the decision is still open.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `selected` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `selected` for the narrative intent reference lineage system contract.
   */
  selected: string | null;
}
