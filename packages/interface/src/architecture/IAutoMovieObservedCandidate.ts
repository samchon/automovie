/**
 * One semantic reading proposed over raw primitives.
 *
 * A candidate is a proposal, never a conclusion. Competing readings of the same
 * marks cite each other in {@link alternatives}, and anything still undecided is
 * named in {@link issues}; both keep a reading from silently hardening into the
 * design.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieObservedCandidate` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieObservedCandidate` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieObservedCandidate {
  /**
   * Stable candidate identity within the document.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;
  /**
   * Open semantic label such as `wall-centerline`, `opening`, `storey-datum`.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `semantic` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `semantic` for the narrative intent reference lineage system contract.
   */
  semantic: string;
  /**
   * Primitive ids this reading is built from; at least one.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `primitives` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `primitives` for the narrative intent reference lineage system contract.
   */
  primitives: string[];
  /**
   * Inclusive `[0, 1]` confidence in this reading.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `confidence` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `confidence` for the narrative intent reference lineage system contract.
   */
  confidence: number;
  /**
   * Competing candidate ids reading the same marks differently; distinct.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `alternatives` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `alternatives` for the narrative intent reference lineage system contract.
   */
  alternatives: string[];
  /**
   * Issue ids that block promotion while open; distinct.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `issues` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `issues` for the narrative intent reference lineage system contract.
   */
  issues: string[];
}
