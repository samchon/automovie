/**
 * What one set of changed identities invalidates.
 *
 * The unaffected artifacts are reported beside the invalidated ones on purpose.
 * "Only these are stale" is a claim about the complement, and a report that
 * names one side alone cannot be checked.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignImpact` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignImpact` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignImpact {
  /**
   * Identities the question was asked about, in ascending order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `changed` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `changed` for the narrative intent reference lineage system contract.
   */
  changed: string[];

  /**
   * Derived artifact ids that must be recomputed, in ascending order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `invalidated` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `invalidated` for the narrative intent reference lineage system contract.
   */
  invalidated: string[];

  /**
   * Derived artifact ids provably unaffected, in ascending order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `unaffected` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `unaffected` for the narrative intent reference lineage system contract.
   */
  unaffected: string[];
}
