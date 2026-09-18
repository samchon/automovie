import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One note as the drawing resolved it.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingAnnotation` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingAnnotation` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingAnnotation {
  /**
   * Annotation identity, as authored.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `id` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `id` for the interior space drawing schedule quantity system contract.
   */
  id: string;
  /**
   * Note text, as authored.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `text` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `text` for the interior space drawing schedule quantity system contract.
   */
  text: string;
  /**
   * Whether the target resolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `status` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `status` for the interior space drawing schedule quantity system contract.
   */
  status: AutoMovieDrawingTargetStatus;
  /**
   * Page position of the target, or `null` when stale.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `at` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `at` for the interior space drawing schedule quantity system contract.
   */
  at: IAutoMovieDrawingPoint | null;
  /**
   * Exactly why the target no longer resolves, or `null` when resolved.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `reason` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `reason` for the interior space drawing schedule quantity system contract.
   */
  reason: string | null;
}
