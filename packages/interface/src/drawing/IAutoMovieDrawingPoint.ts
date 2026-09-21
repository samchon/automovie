/**
 * A point on the drawing page, in metres of model measured on the page.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingPoint` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingPoint` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingPoint {
  /**
   * Distance along the page right axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `x` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `x` for the interior space drawing schedule quantity system contract.
   */
  x: number;

  /**
   * Distance along the page up axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `y` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `y` for the interior space drawing schedule quantity system contract.
   */
  y: number;
}
