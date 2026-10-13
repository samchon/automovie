import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * What a dimension measures, and between which two features.
 *
 * Every derivation resolves both features against the current design and
 * measures between their points. Nothing validates that ids are unique within
 * a view.
 *
 * @evidence contracts/common.md#principled-implementation Two feature references and a measure flag; the distance is computed at derivation time from the current design rather than stored with the spec.
 * @evidence contracts/common.md#clear-and-simple-design An id, two ends and a mode, with pen and text height taken from the view style, so one authored dimension serves every re-derivation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The measure mode is explicit rather than inferred from the projection, so a plan never switches a sloped dimension to its true length on its own.
 * @evidence contracts/common.md#meaningful-documentation Explains why `page` and `world` differ for sloped geometry, that both ends re-resolve each time, and that id uniqueness is not checked.
 * @author Samchon
 */
export interface IAutoMovieDrawingDimensionSpec {
  /** Dimension identity within the view; uniqueness is the author's duty. */
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
