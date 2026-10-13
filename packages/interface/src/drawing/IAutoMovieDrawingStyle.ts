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
