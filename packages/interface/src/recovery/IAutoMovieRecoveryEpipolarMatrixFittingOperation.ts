/** Callable normalized eight-point design fit for a pixel fundamental matrix. */

export namespace IAutoMovieRecoveryEpipolarMatrixFittingOperation {
  /**
   * Require at least eight paired points. Center and isotropically normalize
   * each image population, solve the original design, and require its eighth
   * singular direction to meet the ratio threshold. Impose rank two before
   * denormalizing and return a unit-norm matrix in the original charts.
   */

  export type Operation = (
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
    minimumRatio: number,
    maxSweeps: number,
  ) => {
    /**
     * Unit-norm row-major pixel fundamental matrix, with its largest-magnitude
     * entry nonnegative.
     */
    matrix: number[];
    /** Eighth-to-largest singular value ratio of the normalized original design. */
    designSingularRatio: number;
  };
}
