import { IAutoMovieDrawingDashes } from "./IAutoMovieDrawingDashes";
import { IAutoMovieDrawingWeights } from "./IAutoMovieDrawingWeights";

/**
 * The pen a view is drawn with, in page millimetres rather than model metres.
 *
 * Line weight is the one part of a drawing that is measured on the paper and
 * not in the world: a cut wall reads as a cut wall because its stroke is heavy
 * at every scale, so a weight expressed in metres would thin out as the scale
 * denominator grew. Keeping the four roles' weights and dashes as authored
 * numbers, rather than a named house style, is the difference between shipping
 * a capability and shipping somebody's title block.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingStyle` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingStyle` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingStyle {
  /**
   * Stroke width per role, in page millimetres. Each must be positive.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `weights` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `weights` for the interior space drawing schedule quantity system contract.
   */
  weights: IAutoMovieDrawingWeights;

  /**
   * Dash pattern per role, in page millimetres. Each entry must be positive; an
   * empty array draws a solid line.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `dashes` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `dashes` for the interior space drawing schedule quantity system contract.
   */
  dashes: IAutoMovieDrawingDashes;

  /**
   * Annotation and dimension text height in page millimetres. Positive.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `textHeight` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `textHeight` for the interior space drawing schedule quantity system contract.
   */
  textHeight: number;
}
