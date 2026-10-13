import { IAutoMovieDrawingFeature } from "./IAutoMovieDrawingFeature";

/** What a dimension measures, and between which two features. */
export interface IAutoMovieDrawingDimensionSpec {
  /** Stable dimension identity within the view. */
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
