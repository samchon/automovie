/**
 * One step of the construction plan.
 *
 * Prerequisites make this a directed acyclic graph rather than a numbered list:
 * two wings can be stripped independently and still both precede a shared
 * structural phase. A cycle is refused rather than broken at an arbitrary edge,
 * because there is no correct place to break one.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignPhase` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPhase` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPhase {
  /**
   * Stable phase identity within the lineage.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * Human label such as `demolition`, `structure`, `services`, `finishes`.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `label` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `label` for the narrative intent reference lineage system contract.
   */
  label: string;

  /**
   * Phase ids that must complete before this one; empty for a first phase.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `requires` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `requires` for the narrative intent reference lineage system contract.
   */
  requires: string[];
}
