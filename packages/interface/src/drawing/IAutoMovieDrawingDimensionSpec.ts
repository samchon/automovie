import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * What a dimension measures, and between which two features.
 *
 * Every derivation resolves both features against the current design and
 * measures between their points. `deriveAutoMovieDrawing` refuses a view in
 * which two dimensions share an id.
 *
 * @evidence contracts/common.md#principled-implementation A dimension stores its two pinned features and the measure, never a number, so `deriveAutoMovieDrawing` recomputes the distance from the current design on each derivation.
 * @evidence contracts/common.md#clear-and-simple-design Two feature targets and one measure literal describe every linear dimension; its stroke comes from the view's pen and its value from the derivation, so neither is stored.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No typed or cached value can override the computed one; a repeated id within a view's dimensions is refused by the derivation rather than resolved twice.
 * @evidence contracts/common.md#meaningful-documentation States that both ends are re-resolved, what each measure computes and why both exist, and that a repeated id is refused.
 * @author Samchon
 */
export interface IAutoMovieDrawingDimensionSpec {
  /** Dimension id, unique among the view's dimensions. */
  id: string;

  /** Feature the measurement starts at. */
  from: IAutoMovieDrawingFeature;

  /** Feature the measurement ends at. */
  to: IAutoMovieDrawingFeature;

  /**
   * `page` measures the projected distance on the drawing; `world` measures the
   * true 3D distance.
   *
   * A plan dimension across a sloped ramp is a different number in each, and a
   * drawing that could not say which one it meant would be unusable for setting
   * out.
   */
  measure: "page" | "world";
}
