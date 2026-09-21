import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box a schedule row reports.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `IAutoMovieDrawingScheduleBox` as the located extent a schedule row reports.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingScheduleBox` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingScheduleBox {
  /**
   * Lower corner in metres.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `min` as the lower corner of a scheduled extent.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `min` for the interior space drawing schedule quantity system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Upper corner in metres.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-schedules Exposes `max` as the upper corner of a scheduled extent.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `max` for the interior space drawing schedule quantity system contract.
   */
  max: IAutoMovieVector3;
}
