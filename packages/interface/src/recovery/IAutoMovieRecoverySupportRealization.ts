import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";
import type { IAutoMovieRecoverySupportRealizationMetrics } from "./IAutoMovieRecoverySupportRealizationMetrics";

/**
 * Result of compiling an edited convex-support recipe into a lateral mesh. It
 * includes sampled construction lines and numerical diagnostics from the same
 * Engine realization.
 */
export interface IAutoMovieRecoverySupportRealization {
  /** Generated model with one open convex-support mesh part in metres. */
  model: IAutoMovieModel;

  /**
   * Sampled section loops and boundary curves from the realized support
   * surface.
   */
  construction: IAutoMovieConstructionPolyline.IMutable[];

  /**
   * Counts and numerical qualification of the edited loft, including its face
   * chord bound and boundary defect in metres.
   */
  generation: IAutoMovieRecoverySupportRealizationMetrics;
}
