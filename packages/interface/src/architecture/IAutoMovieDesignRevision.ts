import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * One immutable state of the authored design source.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignRevision` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignRevision` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignRevision {
  /**
   * Stable revision identity within the lineage.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * Revision this one supersedes, or null for the first.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `parent` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `parent` for the narrative intent reference lineage system contract.
   */
  parent: string | null;

  /**
   * SHA-256 over the authored source this revision names.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `digest` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `digest` for the narrative intent reference lineage system contract.
   */
  digest: AutoMovieContentDigest;
}
