import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";

/**
 * Source-free model, coefficient-derived construction and circular-to-cubic
 * approximation bound.
 */
export interface IAutoMovieRecoveryImageRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieConstructionPolyline.IMutable[];

  /** Circular-to-cubic approximation bound, metres. */
  arcDeviationBoundMeters: number;
}
