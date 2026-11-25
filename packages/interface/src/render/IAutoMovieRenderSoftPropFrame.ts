import type { AutoMovieSoftAnalysisStatus } from "../soft/AutoMovieSoftAnalysisStatus";
import type { IAutoMovieSoftBodySurface } from "../soft/IAutoMovieSoftBodySurface";

/**
 * Plain soft prop data for one film instant, supplied by the performance host.
 * The surface holds world-metre coordinates and carries its solver step.
 */
export interface IAutoMovieRenderSoftPropFrame {
  /**
   * Stable identity of the performance subject, distinct from the reusable
   * domain id.
   */
  subject: string;

  /** The engine's projection at the supplied instant. */
  surface: IAutoMovieSoftBodySurface;

  /** The producer's outcome for this state. */
  status: AutoMovieSoftAnalysisStatus;

  /** Cord radius in metres, declared only for a one-wide lattice. */
  cordRadius?: number;
}
