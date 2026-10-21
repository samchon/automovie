/** Actual owner charges and trial checkpoints observed by an analytic case. */
export interface IRecoveryFeasibleObservation {
  /** Combined work callbacks, without inventing elapsed or CPU units. */
  work: number;

  /** Actual nonlinear trial callbacks, accepted and rejected combined. */
  checkpoints: number;
}
