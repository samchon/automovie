/**
 * One axis-aligned rectangular void in a wall's local XY face.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Makes an opening a declared operand of wall construction.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the bounded subtraction input whose topology the wall builder preserves.
 */
export interface IAutoMovieWallOpening {
  /**
   * Stable opening identity used in diagnostics.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps each opening operand independently addressable.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies the opening involved in an operation or topology refusal.
   */
  id: string;
  /**
   * Left edge measured from the wall's left edge.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Locates the opening with a real wall-local dimension.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric horizontal placement of the void.
   */
  x: number;
  /**
   * Bottom edge measured from the wall's bottom edge.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Locates the opening with a real wall-local dimension.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric vertical placement of the void.
   */
  y: number;
  /**
   * Positive opening width.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the physical width of the opening operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies one bounded metric extent of the void.
   */
  width: number;
  /**
   * Positive opening height.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Declares the physical height of the opening operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the other bounded metric extent of the void.
   */
  height: number;
}
