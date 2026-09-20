/**
 * One aspect on which two alternatives differ.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignDifference` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignDifference` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignDifference {
  /**
   * The one subject id both alternatives are talking about.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `subject` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `subject` for the narrative intent reference lineage system contract.
   */
  subject: string;

  /**
   * Aspect the two alternatives disagree on.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `aspect` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `aspect` for the narrative intent reference lineage system contract.
   */
  aspect: string;

  /**
   * Left alternative's value, or null when it leaves the base untouched.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `left` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `left` for the narrative intent reference lineage system contract.
   */
  left: string | null;

  /**
   * Right alternative's value, or null when it leaves the base untouched.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `right` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `right` for the narrative intent reference lineage system contract.
   */
  right: string | null;
}
