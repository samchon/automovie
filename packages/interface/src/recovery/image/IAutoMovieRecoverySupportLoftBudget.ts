/** Finite continuous-planning and tessellation limits for a convex-support loft. */

export interface IAutoMovieRecoverySupportLoftBudget {
  /** Positive model-space chord tolerance, metres. */
  tolerance: number;

  /**
   * Maximum support-plane count; at least three surrounding directions are
   * required.
   */
  maxPlanes: number;

  /** Nonnegative integer maximum retained boundary events. */
  maxEvents: number;

  /** Positive integer maximum tessellation cells. */
  maxCells: number;

  /** Positive integer maximum generated vertices. */
  maxVertices: number;

  /** Positive minimum plane-pair direction sine, strictly less than one. */
  minimumDirectionSine: number;
}
