/**
 * One point in a frame's own source coordinates.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignPoint` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPoint` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPoint {
  /**
   * Finite source-space x.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `x` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `x` for the narrative intent reference lineage system contract.
   */
  x: number;
  /**
   * Finite source-space y, growing the way the source grows it.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `y` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `y` for the narrative intent reference lineage system contract.
   */
  y: number;
}
