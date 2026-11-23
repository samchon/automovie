/**
 * Two pinhole derivatives in one observation's current local camera/point
 * chart.
 */
export interface IAutoMovieRecoveryMapLocalCurvature {
  /** Original calibrated pixel coordinates. */
  pixel: [number, number];

  /** Two local derivative rows, with the world-point coordinates last. */
  jacobian: number[][];

  /** Two symmetric local Hessians in the identical coordinate order. */
  hessians: number[][][];
}
