/** Independent analytic residuals and derivatives for a fixed nonlinear case. */
export interface IRecoveryFeasibleSpecification {
  /** Authored feasible physical starting coordinates. */
  start: number[];

  /** Every complete residual block, including explicit repeated measurements. */
  residuals: (state: readonly number[]) => number[][];

  /** Physical residual Jacobians in the same block/component order. */
  derivatives: (state: readonly number[]) => number[][][];
}
