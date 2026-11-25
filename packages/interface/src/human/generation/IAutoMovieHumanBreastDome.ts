import type { IAutoMovieHumanBreastFootprint } from "./IAutoMovieHumanBreastFootprint";
import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/**
 * Breast frame and footprint inputs and sampled body-point grids in
 * millimetres. Runtime construction and admission remain with
 * AutoMovieHumanBreastDome in Human.
 */
export namespace IAutoMovieHumanBreastDome {
  /** What the dome reads. */
  export interface IInput {
    /** The breast's frame. */
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The footprint. */
    footprint: IAutoMovieHumanBreastFootprint.IFootprint;

    /** The bust point's projection, mm. */
    projection: number;
  }

  /**
   * Sample grid of body-frame [x, y, z] points in millimetres. Rows advance
   * along the breast frame's up axis and columns along its lateral axis; this
   * is the isolated dome display surface.
   */
  export type SurfaceResult = [number, number, number][][];
}
