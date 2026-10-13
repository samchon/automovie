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
 * Deriving a drawing never reads the style; only `autoMovieDrawingToSvg` does,
 * and it throws when a weight, dash or text height is not a finite positive
 * number. Opening outlines are stroked with the `cut` weight and dimension
 * lines with the `projected` weight.
 *
 * @evidence contracts/common.md#principled-implementation Weights, dashes and text height are page millimetres because the serializer lays the SVG out in millimetres at `1000 / scale` per model metre, so a stroke keeps its paper width at every scale; `autoMovieDrawingToSvg` throws on any non-finite or non-positive value before writing.
 * @evidence contracts/common.md#clear-and-simple-design The style is only a pen: `deriveAutoMovieDrawing` ignores it and the drawing digest excludes it, so restyling a sheet changes the SVG bytes and never the derived drawing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No house style or default is built in; the serializer's reuse of the `cut` weight for opening outlines and the `projected` weight for dimension lines is a fixed rule applied to every sheet.
 * @evidence contracts/common.md#meaningful-documentation States the millimetre unit and why it is not metres, the positivity rules and who enforces them, that an empty dash array is solid, and which role weights openings and dimensions borrow.
 * @author Samchon
 */
export interface IAutoMovieDrawingStyle {
  /** Stroke width per role, in page millimetres. Each must be positive. */
  weights: IAutoMovieDrawingWeights;

  /**
   * Dash pattern per role, in page millimetres. Each entry must be positive; an
   * empty array draws a solid line.
   */
  dashes: IAutoMovieDrawingDashes;

  /** Annotation and dimension text height in page millimetres. Positive. */
  textHeight: number;
}
