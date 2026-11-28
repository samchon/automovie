/** Callable projected solution of a normalized sparse three-axis box quadratic. */

export namespace IAutoMovieRecoveryChartBoxSolve {
  /**
   * Minimize `0.5 xᵀ H x - bᵀ x` on the supplied componentwise box. Supply a
   * finite symmetric Gram matrix and feasible finite warm start when present.
   * Solve by diagonally scaled projected acceleration, restart rising momentum,
   * and return the best feasible iterate with its original projected-gradient
   * diagnostic.
   */

  export type Operation = (input: {
    /**
     * Sparse symmetric normalized Gram rows, with column index and coefficient
     * for each stored entry.
     */
    hessian: readonly (readonly (readonly [number, number])[])[];

    /** Right-hand terms interleaved X, Y, Z for each independent control. */
    rhs: readonly number[];

    /** Lower componentwise endpoints of the original normalized box. */
    lower: readonly [number, number, number];

    /** Upper componentwise endpoints of the original normalized box. */
    upper: readonly [number, number, number];

    /** Positive safe integer cap on projected proposals. */
    maxIterations: number;

    /**
     * Finite nonnegative threshold on the original normalized projected
     * gradient.
     */
    gradientTolerance: number;

    /**
     * Optional finite feasible original normalized coordinates, interleaved by
     * control. Omission starts at projected zero.
     */
    initialValues?: readonly number[];
  }) => {
    /**
     * Best returned feasible coordinates in the original normalized component
     * order.
     */
    values: Float64Array;

    /**
     * Actual projected proposals, including a proposal discarded during
     * momentum restart.
     */
    iterations: number;

    /**
     * Infinity norm of the original projected-gradient mapping at the returned
     * iterate.
     */
    projectedGradient: number;

    /** Actual acceleration restarts when an objective proposal would increase. */
    restarts: number;

    /** Normalized quadratic value at the returned iterate. */
    objective: number;

    /** Normalized quadratic value at the admitted feasible starting coordinates. */
    initialObjective: number;

    /** Smallest positive Gram diagonal, or null for an all-zero diagonal. */
    minimumPositiveDiagonal: number | null;

    /** Largest observed original Gram diagonal. */
    maximumDiagonal: number;

    /**
     * Original Gram absolute row-sum upper estimate used for projected-gradient
     * evaluation.
     */
    originalLipschitz: number;

    /** Absolute row-sum upper estimate after diagonal congruence. */
    scaledLipschitz: number;
  };
}
