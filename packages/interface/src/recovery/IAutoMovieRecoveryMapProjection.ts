/** Owned calibrated pixels, positive depth and complete local derivatives. */
export interface IAutoMovieRecoveryMapProjection {
  /** Calibrated two-coordinate pixel in the supplied intrinsic chart. */
  pixel: [number, number];

  /** Strictly positive finite camera-frame Z coordinate. */
  depth: number;

  /**
   * Two owned rows ordered as three left-rotation then three translation
   * columns.
   */
  cameraJacobian: number[][];

  /** Two owned rows of three world-point derivative columns. */
  pointJacobian: number[][];
}
