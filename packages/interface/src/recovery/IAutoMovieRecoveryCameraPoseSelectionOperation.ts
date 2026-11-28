import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPointTriangulationOperation,
} from "..";

/**
 * Callable measurement of four calibrated relative-pose branches on one fixed
 * inlier population.
 */

export namespace IAutoMovieRecoveryCameraPoseSelectionOperation {
  /**
   * Project the fundamental matrix into essential space and triangulate every
   * paired observation under each candidate pose. Return the branch with the
   * largest positive-depth count. A tied largest count leaves the candidate
   * explicitly ambiguous.
   */

  export type Operation = (
    fundamental: readonly number[],
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    minimumDesignRatio: number,
    maxSweeps: number,
  ) => {
    /** Proper first-to-second rotation from the leading positive-depth branch. */
    rotation: number[];

    /** Unit translation in second-camera axes for that branch. */
    translation: [number, number, number];

    /**
     * Unit-norm row-major pixel fundamental matrix reprojected from the
     * calibrated essential model.
     */
    fundamental: number[];

    /**
     * Leading branch triangulations in the original correspondence order,
     * including unresolved result slots.
     */
    points: ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[];

    /**
     * Positive-in-both-cameras counts of the four candidate branches in
     * decomposition order.
     */
    allPositiveDepthCounts: number[];

    /** Leading positive-depth count divided by all tested correspondences. */
    positiveDepthFraction: number;

    /**
     * Median recorded ray angle in radians for points positive in both cameras,
     * or null if none.
     */
    medianParallaxRadians: number | null;

    /** True when exactly one branch has the maximal positive-depth count. */
    uniqueWinner: boolean;

    /**
     * Dimensionless relative Frobenius change under essential singular-value
     * equalization.
     */
    relativeProjectionDiscrepancy: number;
  };
}
