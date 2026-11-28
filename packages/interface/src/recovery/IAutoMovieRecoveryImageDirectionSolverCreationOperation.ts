/**
 * Callable contract for building and reusing the two-column camera-direction
 * factorization used by aligned-ellipse fitting.
 */

export namespace IAutoMovieRecoveryImageDirectionSolverCreationOperation {
  /**
   * Factor the ordered two-column direction design and require its
   * smaller-to-larger singular value ratio to meet `minimumRatio`. The returned
   * solve reuses the factorization for observation vectors in the same view
   * order.
   */

  export type Operation = (
    directions: readonly [number, number][],
    minimumRatio: number,
  ) => {
    /**
     * Dimensionless ratio of the smaller to the larger singular value of the
     * factored design.
     */
    ratio: number;
    /**
     * Solve the accepted design for one observation value per direction row,
     * preserving row order. Return the two coefficients in column order.
     */
    solve: (values: readonly number[]) => [number, number];
  };
}
