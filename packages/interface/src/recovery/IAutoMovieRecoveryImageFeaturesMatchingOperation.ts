import type { IAutoMovieRecoveryImageFeaturesExtractionOperation } from "..";

/** Callable directed matching of two admitted image descriptor populations. */

export namespace IAutoMovieRecoveryImageFeaturesMatchingOperation {
  /**
   * Use a strict best-to-second-distance ratio from first to second and require
   * the second feature's unique reverse nearest match to identify the first.
   * Check actual traversal work before matching. Fewer than two targets or an
   * empty source yields no comparisons. Preserve selected indices and original
   * pixel locations.
   */

  export type Operation = (
    first: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>["points"][number][],
    second: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>["points"][number][],
    ratio: number,
    maxPairs: number,
  ) => {
    /** Query feature index in the retained first image population. */
    firstIndex: number;

    /** Target feature index in the retained second image population. */
    secondIndex: number;

    /** First measured pixel-center location [column, row]. */
    first: [number, number];

    /** Second measured pixel-center location [column, row]. */
    second: [number, number];

    /** Dimensionless sum of squared differences of the normalized components. */
    squaredDescriptorDistance: number;

    /**
     * Forward Euclidean best-to-second candidate distance ratio used by the
     * strict gate.
     */
    descriptorDistanceRatio: number;
  }[];
}
