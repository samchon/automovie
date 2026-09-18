import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * A note pinned to one feature of the design.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingAnnotationSpec` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingAnnotationSpec` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingAnnotationSpec {
  /**
   * Stable annotation identity within the view.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `id` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `id` for the interior space drawing schedule quantity system contract.
   */
  id: string;

  /**
   * Note text, drawn as authored.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `text` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `text` for the interior space drawing schedule quantity system contract.
   */
  text: string;

  /**
   * Feature the note is pinned to.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `target` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `target` for the interior space drawing schedule quantity system contract.
   */
  target: IAutoMovieDrawingFeature;
}
