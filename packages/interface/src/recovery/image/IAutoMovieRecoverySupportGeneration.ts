/**
 * Generation counts and a numerical boundary defect, without hidden-surface
 * qualification.
 */
export interface IAutoMovieRecoverySupportGeneration {
  /** Number of generated support-envelope events. */
  events: number;

  /** Number of generated support intervals. */
  intervals: number;

  /** Number of generated mesh vertices. */
  vertices: number;

  /** Largest numerical boundary discrepancy, metres. */
  maximumBoundaryDefectMeters: number;
}
