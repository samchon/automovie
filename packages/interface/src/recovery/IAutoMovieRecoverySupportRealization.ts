import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";
import type { IAutoMovieRecoverySupportRealizationMetrics } from "./IAutoMovieRecoverySupportRealizationMetrics";

/**
 * Source-free convex-support model, construction and numerical generation
 * diagnostics.
 */
export interface IAutoMovieRecoverySupportRealization {
  /** Source-free generated model, in model metres. */
  model: IAutoMovieModel;

  /** Lines evaluated from the same generating coefficients. */
  construction: IAutoMovieConstructionPolyline.IMutable[];

  /** Actual numerical generation counts and qualifications. */
  generation: IAutoMovieRecoverySupportRealizationMetrics;
}
