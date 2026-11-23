/**
 * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD.
 * Rank two is imposed in the normalized image chart before denormalization,
 * following Hartley's normalized algorithm; this is an algebraic initializer,
 * not a calibrated-pose fit or a pixel-error certificate.
 */

export namespace IAutoMovieRecoveryEpipolarMatrixFittingOperation {
  /**
   * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD.
   * Rank two is imposed in the normalized image chart before denormalization,
   * following Hartley's normalized algorithm; this is an algebraic initializer,
   * not a calibrated-pose fit or a pixel-error certificate.
   */

  export type Operation = (
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
    minimumRatio: number,
    maxSweeps: number,
  ) => {
    /**
     * Row-major 3 by 3 epipolar model in the declared image charts; homogeneous
     * scale is arbitrary.
     */
    matrix: number[];
    /**
     * Measured smallest over largest relevant design singular value;
     * dimensionless rank evidence.
     */
    designSingularRatio: number;
  };
}
