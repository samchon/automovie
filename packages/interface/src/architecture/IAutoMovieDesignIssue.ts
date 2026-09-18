/**
 * Something still undecided about a reference, and what it blocks.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignIssue` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignIssue` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignIssue {
  /**
   * Stable issue identity within the document.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;
  /**
   * Closed reason family that keeps a reading unsettled.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `kind` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `kind` for the narrative intent reference lineage system contract.
   */
  kind:
    | "unknown-scale"
    | "ambiguous-geometry"
    | "occluded"
    | "illegible"
    | "conflicting-dimension"
    | "other";
  /**
   * Primitive or candidate ids this issue is about; at least one, distinct.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `subjects` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `subjects` for the narrative intent reference lineage system contract.
   */
  subjects: string[];
  /**
   * What a human still has to decide.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `detail` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `detail` for the narrative intent reference lineage system contract.
   */
  detail: string;
  /**
   * Whether the issue is still open.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `open` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `open` for the narrative intent reference lineage system contract.
   */
  open: boolean;
}
