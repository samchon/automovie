/**
 * One point of a code-authored 2D construction profile.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Expresses free-form construction geometry in real coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Carries one metric input to the geometry kernel.
 */
export interface IAutoMovieProfilePoint {
  /**
   * Horizontal profile coordinate in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps the authored horizontal dimension in metres.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric horizontal component of a free-form input.
   */
  x: number;
  /**
   * Vertical profile coordinate in metres.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps the authored vertical dimension in metres.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric vertical component of a free-form input.
   */
  y: number;
}
