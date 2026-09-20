import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * The exact view one derived artifact was produced under.
 *
 * Every field is required because a missing one is the failure mode this record
 * exists to prevent: a quantity take-off that does not say which alternative it
 * counted, or a render that does not say which phase it depicts, is a number
 * and a picture that cannot be checked against anything.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `IAutoMovieDesignStamp` as the portable data boundary for the production design reference original derived requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignStamp` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignStamp {
  /**
   * Revision the artifact was derived from.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `revision` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `revision` for the narrative intent reference lineage system contract.
   */
  revision: string;

  /**
   * Variant applied, or null for the base design.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `variant` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `variant` for the narrative intent reference lineage system contract.
   */
  variant: string | null;

  /**
   * Phase the artifact depicts, or null when it is phase-independent.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `phase` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `phase` for the narrative intent reference lineage system contract.
   */
  phase: string | null;

  /**
   * SHA-256 over the lowering configuration that produced the artifact.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `configuration` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `configuration` for the narrative intent reference lineage system contract.
   */
  configuration: AutoMovieContentDigest;
}
