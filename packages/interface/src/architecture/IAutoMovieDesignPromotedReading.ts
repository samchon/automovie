import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One reading settled enough to become authored metric geometry.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignPromotedReading` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPromotedReading` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPromotedReading {
  /**
   * Candidate that produced it.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `candidate` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `candidate` for the narrative intent reference lineage system contract.
   */
  candidate: string;

  /**
   * The candidate's own semantic label.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `semantic` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `semantic` for the narrative intent reference lineage system contract.
   */
  semantic: string;

  /**
   * One world-space polyline in metres per primitive the candidate reads, in
   * the candidate's own primitive order and each in source point order.
   *
   * They stay separate rather than concatenated because a candidate built from
   * two disjoint marks is two runs, and a single flattened list would join them
   * with a segment nobody drew.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `outlines` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `outlines` for the narrative intent reference lineage system contract.
   */
  outlines: IAutoMovieVector3[][];
}
