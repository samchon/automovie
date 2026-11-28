/**
 * Cumulative scene work charged across seed-component construction and
 * camera-extension attempts. Charges remain when a detached transaction is
 * refused.
 */
export interface IAutoMovieRecoverySceneWork {
  /** Number of registration transactions admitted to the attempt ledger. */
  cameraAttempts: number;

  /**
   * Six-point proposals charged before evaluation across candidate
   * registrations.
   */
  resectionTrials: number;

  /** New-point designs charged during landmark growth, including retries. */
  triangulations: number;

  /** Attempted point designs that returned no qualified finite point. */
  triangulationRefusals: number;

  /**
   * Detached joint-fit calls charged, including seed completion and repeated
   * closure fits.
   */
  jointFits: number;

  /**
   * Joint refinement checkpoints charged, including a check that can stop on
   * convergence.
   */
  jointIterationAttempts: number;

  /**
   * Charged model units for point and joint work and applicable diagnostics and
   * checkpoints.
   */
  linearWork: number;
}
