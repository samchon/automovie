/**
 * Completed 3D-to-2D registration diagnostics for a target camera. Retain the
 * evidence for both successful and refused resection.
 */
export interface IAutoMovieRecoveryMapResection {
  /**
   * Distinct existing landmark and target-feature pairs offered to
   * registration.
   */
  candidates: number;

  /**
   * Final scored pairs whose target projection has positive depth and residual
   * within the pixel limit.
   */
  inliers: number;

  /** Six-point proposals evaluated, including failed numerical initializers. */
  trials: number;

  /**
   * Ideal all-inlier trial target at the final measured support, or null when a
   * finite target is unavailable.
   */
  requiredTrials: number | null;

  /** Number of eligible proposals admitted to local refinement in draw order. */
  localRefinements: number;

  /** Recognized numerical fitting exceptions during proposal or refit work. */
  numericalRefusals: number;

  /** Number of fixed-support final refinement attempts. */
  finalRefits: number;

  /** Whether final reclassification preserved the exact inlier index set. */
  stable: boolean;

  /**
   * Convergence of the returned final refinement report, or null if no report
   * is available.
   */
  converged: boolean | null;

  /** Reasons the completed resection withheld a qualified camera. */
  refusalReasons: string[];
}
