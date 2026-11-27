/** Scalar bounds admitted once for one fixed feasible camera-map fit. */
export interface IAutoMovieRecoveryFeasibleMapWork {
  /** Original fixed-population observation count. */
  observations: number;

  /** Camera coordinates after the seven-freedom gauge. */
  cameraWidth: number;

  /** Camera and landmark physical coordinate count. */
  width: number;

  /** Whether selected-u objective agreement is enabled. */
  adaptive: boolean;

  /** Visits charged before each adaptive agreement reaction. */
  agreementWork: number;

  /** Base numerical arrays plus64 simultaneous current-radius chart slots. */
  retained: number;

  /** Visits charged before each complete actual evaluation. */
  evaluationWork: number;

  /**
   * Visits charged before each model, including512 fixed chart differential
   * visits.
   */
  modelWork: number;
}
