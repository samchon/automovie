/** Point-eliminated original camera rows and retained upper point blocks. */
export interface IAutoMovieRecoveryMapElimination {
  /** Reduced camera-only rows, including authored damping rows when requested. */
  rows: number[][];

  /** Transformed minus-residual in matching row order. */
  right: number[];

  /**
   * Three upper point rows followed by C camera coefficients and one right
   * value per landmark.
   */
  triangular: number[][][];
}
