import { IAutoMovieDrawingDashes } from "./IAutoMovieDrawingDashes";
import { IAutoMovieDrawingWeights } from "./IAutoMovieDrawingWeights";

/**
 * The pen a view is drawn with, in page millimetres rather than model metres.
 *
 * A cut wall reads as a cut wall because its stroke is heavy at every scale, so
 * line weight is measured on the paper; a weight in metres would thin out as
 * the scale denominator grew. The style holds authored numbers per role rather
 * than a named house style.
 *
 * Deriving a drawing never reads the style; only `autoMovieDrawingToSvg` does,
 * and it throws when a weight, dash entry or the text height is not a finite
 * positive number. Region fills carry no stroke, opening outlines are stroked
 * with the `cut` weight, and dimension lines with the `projected` weight.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingToSvg` writes each line's role weight as `stroke-width` and its dash pattern as `stroke-dasharray` in a sheet whose user unit is one page millimetre, after checking every role's weight and dash entries and the text height are finite and positive.
 * @evidence contracts/common.md#clear-and-simple-design Styling lives on the view and is applied only at serialization, so one derived drawing and its digest stay independent of the pen, and weights and dashes are per-role maps over the closed role union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid value throws before any SVG is written instead of being clamped or replaced with a default, and no role, layer or discipline gets a built-in pen.
 * @evidence contracts/common.md#meaningful-documentation States the page-millimetre unit and its reason, that derivation ignores the style, the serializer's refusal, and which pen strokes openings and dimensions; members restate the positivity rule, the solid meaning of an empty dash array, and that the text height sizes annotations only.
 * @author Samchon
 */
export interface IAutoMovieDrawingStyle {
  /** Stroke width per role, in page millimetres; each must be positive. */
  weights: IAutoMovieDrawingWeights;

  /**
   * Dash pattern per role, in page millimetres; each entry must be positive,
   * and an empty array draws a solid line.
   */
  dashes: IAutoMovieDrawingDashes;

  /**
   * Annotation text height in page millimetres, written as SVG `font-size`;
   * positive. Dimensions print no text and carry their value as `data-value`.
   */
  textHeight: number;
}
