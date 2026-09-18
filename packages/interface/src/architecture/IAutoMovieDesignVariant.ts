import { IAutoMovieDesignChange } from "./IAutoMovieDesignChange";

/**
 * One design alternative: a change set over a common base revision.
 *
 * An alternative is never a copy of the building. Duplicating the design is
 * precisely what destroys the identity that makes two schemes comparable, so a
 * variant carries only what it changes and every subject it does not name keeps
 * the id, the geometry, and the citations the base revision gave it.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignVariant` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignVariant` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignVariant {
  /**
   * Stable variant identity within the lineage.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;
  /**
   * Human label such as `warm-oak` or `open-plan`.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `label` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `label` for the narrative intent reference lineage system contract.
   */
  label: string;
  /**
   * Revision every change in this variant applies to.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `base` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `base` for the narrative intent reference lineage system contract.
   */
  base: string;
  /**
   * Edits this alternative makes; at most one per subject and aspect.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `changes` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `changes` for the narrative intent reference lineage system contract.
   */
  changes: IAutoMovieDesignChange[];
}
