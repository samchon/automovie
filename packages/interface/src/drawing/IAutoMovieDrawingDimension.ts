import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One dimension as the drawing resolved it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingDimension` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingDimension` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingDimension {
  /**
   * Dimension identity, as authored.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `id` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `id` for the interior space drawing schedule quantity system contract.
   */
  id: string;
  /**
   * What the measurement means.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `measure` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `measure` for the interior space drawing schedule quantity system contract.
   */
  measure: "page" | "world";
  /**
   * Whether both ends resolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `status` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `status` for the interior space drawing schedule quantity system contract.
   */
  status: AutoMovieDrawingTargetStatus;
  /**
   * Page start point, or `null` when stale.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `from` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `from` for the interior space drawing schedule quantity system contract.
   */
  from: IAutoMovieDrawingPoint | null;
  /**
   * Page end point, or `null` when stale.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `to` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `to` for the interior space drawing schedule quantity system contract.
   */
  to: IAutoMovieDrawingPoint | null;
  /**
   * Measured distance in metres, or `null` when stale.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `value` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `value` for the interior space drawing schedule quantity system contract.
   */
  value: number | null;
  /**
   * Exactly why the target no longer resolves, or `null` when resolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `reason` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `reason` for the interior space drawing schedule quantity system contract.
   */
  reason: string | null;
}
