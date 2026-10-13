import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/**
 * What a dimension measures, and between which two features.
 *
 * Every derivation resolves both features against the current design and
 * measures between their points. Nothing validates that ids are unique within
 * a view.
 *
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
