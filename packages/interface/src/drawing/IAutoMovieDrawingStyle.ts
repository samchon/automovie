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
 * @evidence contracts/common.md#principled-implementation The serializer checks finite positive role weights, dash entries and text height, then formats them to three decimals in page millimetres. Admission precedes formatting, so a small positive value can print as zero and extreme finite values can overflow the intermediate round(value*1000)/1000; no printed-value admission follows.
 * @evidence contracts/common.md#clear-and-simple-design Styling lives on the view and is applied only at serialization, so drawing metadata and its digest stay independent of the pen. The serializer matches view id, not the complete original view; weight and dash maps supply every role but do not form runtime closed-object admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An invalid value throws before any SVG is written instead of being clamped or replaced with a default, and no role, layer or discipline gets a built-in pen.
 * @evidence contracts/common.md#meaningful-documentation States the page-millimetre unit and its reason, that derivation ignores the style, the serializer's refusal, and which pen strokes openings and dimensions; members restate the positivity rule, the solid meaning of an empty dash array, and that the text height sizes annotations only.
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
