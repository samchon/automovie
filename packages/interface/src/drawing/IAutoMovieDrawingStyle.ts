import type { IAutoMovieDrawingDashes } from "./IAutoMovieDrawingDashes";
import type { IAutoMovieDrawingWeights } from "./IAutoMovieDrawingWeights";

/**
 * The pen a view is drawn with, in page millimetres rather than model metres.
 *
 * A cut wall reads as a cut wall because its stroke is heavy at every scale, so
 * line weight is measured on the paper; a weight in metres would thin out as
 * the scale denominator grew. The style holds authored numbers per role rather
 * than a named house style.
 *
 * Deriving a drawing never reads the style; only `drawingToSvg` does,
 * and it throws when a weight, dash entry or the text height is not a finite
 * positive number. Region fills carry no stroke, opening outlines are stroked
 * with the `cut` weight, and dimension lines with the `projected` weight.
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
