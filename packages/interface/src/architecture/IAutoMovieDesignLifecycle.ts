/**
 * When one subject enters and leaves the work.
 *
 * Every declared subject carries exactly one of these. Totality is the point:
 * the alternative is a default, and any default here would be a claim nobody
 * made, either that an element predates the work or that it survives it.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignLifecycle` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignLifecycle` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignLifecycle {
  /**
   * Declared subject id this record is about.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `subject` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `subject` for the narrative intent reference lineage system contract.
   */
  subject: string;
  /**
   * Phase that installs it, or null when it predates the work.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `introducedIn` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `introducedIn` for the narrative intent reference lineage system contract.
   */
  introducedIn: string | null;
  /**
   * Phase that removes it, or null when it outlives the work.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `removedIn` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `removedIn` for the narrative intent reference lineage system contract.
   */
  removedIn: string | null;
}
