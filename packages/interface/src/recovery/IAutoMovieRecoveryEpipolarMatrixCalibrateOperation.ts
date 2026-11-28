import type { IAutoMovieRecoveryCameraChartCreationOperation } from "..";

/**
 * Callable projection of a pixel fundamental matrix into supplied-calibration
 * essential space.
 */

export namespace IAutoMovieRecoveryEpipolarMatrixCalibrateOperation {
  /**
   * Use the fixed intrinsics to form the calibrated matrix and require two
   * resolved singular directions. Build a rank-two essential model with equal
   * leading singular values, its pixel-chart fundamental matrix, and the four
   * relative-pose branches.
   */

  export type Operation = (
    fundamental: readonly number[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    maxSweeps: number,
  ) => {
    /**
     * Row-major rank-two calibrated essential matrix with equal leading
     * singular values.
     */
    essential: number[];

    /**
     * Unit-norm row-major fundamental matrix in the supplied original pixel
     * charts.
     */
    fundamental: number[];

    /**
     * Relative Frobenius change from the original calibrated singular values to
     * their equal-leading rank-two projection.
     */
    relativeProjectionDiscrepancy: number;

    /** Four candidate first-to-second transforms in decomposition order. */
    poses: {
      /** Nine row-major coefficients of a proper first-to-second rotation. */
      rotation: number[];
      /** One sign of a unit translation direction in second-camera axes. */
      translation: [number, number, number];
    }[];
  };
}
