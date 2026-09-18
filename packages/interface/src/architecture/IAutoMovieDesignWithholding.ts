/**
 * One reading deliberately left as observation, and why.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignWithholding` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignWithholding` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignWithholding {
  /**
   * Candidate that stays an observation.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `candidate` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `candidate` for the narrative intent reference lineage system contract.
   */
  candidate: string;

  /**
   * Closed reason family that kept it unpromoted.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `reason` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `reason` for the narrative intent reference lineage system contract.
   */
  reason:
    | "unobserved"
    | "unknown-scale"
    | "ambiguous-candidate"
    | "open-issue"
    | "low-confidence"
    | "unsupported-geometry";

  /**
   * Human-readable statement of what would have to change.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `detail` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `detail` for the narrative intent reference lineage system contract.
   */
  detail: string;
}
