import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * Page bounding box of a drawing's content.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingExtent` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingExtent` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingExtent {
  /**
   * Lowest page coordinate on each axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `min` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `min` for the interior space drawing schedule quantity system contract.
   */
  min: IAutoMovieDrawingPoint;
  /**
   * Highest page coordinate on each axis.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `max` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `max` for the interior space drawing schedule quantity system contract.
   */
  max: IAutoMovieDrawingPoint;
}
