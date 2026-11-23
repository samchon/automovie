/** Consumed scene work, including failed and rolled-back transactions. */
export interface IAutoMovieRecoverySceneWork {
  /** Camera transactions begun, including failures. */
  cameraAttempts: number;

  /** Six-point proposals actually started. */
  resectionTrials: number;

  /**
   * Original point designs actually attempted, including refused/retried
   * tracks.
   */
  triangulations: number;

  /** Attempted point designs that returned no qualified point. */
  triangulationRefusals: number;

  /** Joint fits actually begun, including rolled-back fits. */
  jointFits: number;

  /** Joint iteration attempts, including gradient-stop checks. */
  jointIterationAttempts: number;

  /**
   * Charged dimension-sweep units before point/joint work, not actual
   * scalar-operation counts.
   */
  linearWork: number;
}
