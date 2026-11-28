import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";

/**
 * Result of compiling a saved aligned-ellipse recipe into an open bicubic
 * lateral surface. Its construction lines sample the same generated atlas used
 * in the model.
 */
export interface IAutoMovieRecoveryImageRealization {
  /** Generated model with one open bicubic lateral part in metres. */
  model: IAutoMovieModel;

  /**
   * Sampled section loops and meridians in metres, evaluated from the same
   * atlas as the model.
   */
  construction: IAutoMovieConstructionPolyline.IMutable[];

  /**
   * Upper bound in metres for the quarter-circle cubic approximation after
   * scaling by the largest horizontal radius.
   */
  arcDeviationBoundMeters: number;
}
