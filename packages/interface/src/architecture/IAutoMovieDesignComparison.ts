import { IAutoMovieDesignDifference } from "./IAutoMovieDesignDifference";

/**
 * The result of comparing two alternatives on their common basis.
 *
 * Both alternatives must apply to the same revision, so the comparison is
 * between two schemes and not between two buildings. Every difference names a
 * subject id both schemes share, which is the mechanical proof that identity
 * survived the alternative.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignComparison` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignComparison` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignComparison {
  /**
   * Base revision both alternatives apply to.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `revision` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `revision` for the narrative intent reference lineage system contract.
   */
  revision: string;
  /**
   * Left variant id.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `left` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `left` for the narrative intent reference lineage system contract.
   */
  left: string;
  /**
   * Right variant id.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `right` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `right` for the narrative intent reference lineage system contract.
   */
  right: string;
  /**
   * Subject ids neither alternative edits, in ascending order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `common` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `common` for the narrative intent reference lineage system contract.
   */
  common: string[];
  /**
   * Every differing subject and aspect, in ascending order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `differences` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `differences` for the narrative intent reference lineage system contract.
   */
  differences: IAutoMovieDesignDifference[];
}
