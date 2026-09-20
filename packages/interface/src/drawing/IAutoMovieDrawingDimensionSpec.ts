import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * What a dimension measures, and between which two features.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingDimensionSpec` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingDimensionSpec` for the interior space drawing schedule quantity system contract.
 */
export interface IAutoMovieDrawingDimensionSpec {
  /**
   * Stable dimension identity within the view.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `id` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `id` for the interior space drawing schedule quantity system contract.
   */
  id: string;

  /**
   * Feature the measurement starts at.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `from` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `from` for the interior space drawing schedule quantity system contract.
   */
  from: IAutoMovieDrawingFeature;

  /**
   * Feature the measurement ends at.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `to` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `to` for the interior space drawing schedule quantity system contract.
   */
  to: IAutoMovieDrawingFeature;

  /**
   * `page` measures the projected distance on the drawing; `world` measures the
   * true 3D distance.
   *
   * A plan dimension across a sloped ramp is a different number in each, and a
   * drawing that could not say which one it meant would be unusable for setting
   * out.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `measure` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `measure` for the interior space drawing schedule quantity system contract.
   */
  measure: "page" | "world";
}
