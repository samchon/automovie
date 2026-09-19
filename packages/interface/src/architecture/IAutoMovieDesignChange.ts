/**
 * One deterministic edit a variant applies to its base revision.
 *
 * The edit is recorded as an author-serialized value rather than a typed patch
 * because lineage does not know the shape of the graph it is editing. Two
 * alternatives are compared by comparing these strings verbatim, so the same
 * authored value always reads as the same decision.
 *
 * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `IAutoMovieDesignChange` as the portable data boundary for the provenance lineage gaps requirement.
 * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `IAutoMovieDesignChange` for the evp lineage gap representation system contract.
 */
export interface IAutoMovieDesignChange {
  /**
   * Stable change identity within the lineage.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `id` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `id` for the evp lineage gap representation system contract.
   */
  id: string;

  /**
   * Declared subject id this change edits.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `subject` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `subject` for the evp lineage gap representation system contract.
   */
  subject: string;

  /**
   * Open aspect label such as `material`, `layout`, `lighting`, `opening`.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `aspect` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `aspect` for the evp lineage gap representation system contract.
   */
  aspect: string;

  /**
   * Author-serialized replacement value, compared verbatim across variants.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `value` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `value` for the evp lineage gap representation system contract.
   */
  value: string;

  /**
   * Why this alternative makes the change.
   *
   * @evidence requirements/evidence-and-provenance/entities-activities-agents-and-lineage.md#provenance-lineage-gaps Exposes `rationale` as the portable data boundary for the provenance lineage gaps requirement.
   * @evidence specifications/evidence-and-provenance/entities-activities-agents-and-lineage.md#evp-lineage-gap-representation Types `rationale` for the evp lineage gap representation system contract.
   */
  rationale: string;
}
