/**
 * Calibrated projection and first derivatives of one finite point in front of
 * the supplied camera. The derivative rows follow pixel X and Y in the same
 * supplied chart.
 */
export interface IAutoMovieRecoveryMapProjection {
  /** Owned pixel X and Y in the supplied intrinsic chart. */
  pixel: [number, number];

  /** Finite positive camera-frame Z in the reconstruction's length units. */
  depth: number;

  /**
   * Two pixel-coordinate derivative rows. Columns are three infinitesimal
   * left-rotation components in radians for R, then three additive camera-frame
   * translation components.
   */
  cameraJacobian: number[][];

  /** Two pixel-coordinate derivative rows with world-point X, Y and Z columns. */
  pointJacobian: number[][];
}
