/** Data and callback contracts shared by the SolveQuadraticKernel operations. */
export namespace IAutoMovieSolveQuadraticKernel {
  /**
   * Solve one admitted interval CSC problem entirely in engine-owned
   * TypeScript. The public adapter owns semantic admission and original-row
   * residual checks. This boundary owns equivalent conic expansion, reversible
   * equilibration and the cold homogeneous interior-point solve. The
   * compatibility initial vector remains ignored, with no retained factors or
   * preceding-call warm state.
   *
   * Status 1 is Solved, 2/3 are primal/dual infeasibility, 4 is AlmostSolved;
   * 5/6 are reduced-accuracy infeasibility, 7 is the iteration limit, 9 is
   * numerical refusal and 10 is insufficient progress. Only status 1 means full
   * convergence. Zero variables return negative API status with unavailable
   * diagnostics as NaN. Unsuccessful vectors must not be accepted as geometry.
   * Historical native transport and bytes remain in repository history, outside
   * shipped product paths.
   */
  export type IInput = {
    /**
     * Diagonal P coefficients of the convex objective 1/2_xᵀ_P_x + qᵀ_x; the
     * public adapter admits finite nonnegative coefficients.
     */
    diagonal: readonly number[];
    /**
     * Finite linear objective vector q, with the same variable count as
     * diagonal.
     */
    linear: readonly number[];
    /**
     * Compressed sparse column offsets for A, length variable-count plus one;
     * final offset equals the coefficient count.
     */
    columns: readonly number[];
    /**
     * Zero-based constraint row ordinal for each CSC coefficient, aligned with
     * values.
     */
    rowIndices: readonly number[];
    /**
     * Finite CSC coefficients of A in the caller's numerical scaling, aligned
     * with rowIndices.
     */
    values: readonly number[];
    /**
     * Lower bound for each original interval row; negative infinity represents
     * an absent lower side.
     */
    lower: readonly number[];
    /**
     * Upper bound for each original interval row; positive infinity represents
     * an absent upper side, and equal finite bounds form an equality.
     */
    upper: readonly number[];
    /**
     * Optional compatibility vector; the kernel deliberately ignores it and
     * always starts a cold homogeneous solve.
     */
    initial?: readonly number[];
  };

  /**
   * Solve one admitted interval CSC problem entirely in engine-owned
   * TypeScript. The public adapter owns semantic admission and original-row
   * residual checks. This boundary owns equivalent conic expansion, reversible
   * equilibration and the cold homogeneous interior-point solve. The
   * compatibility initial vector remains ignored, with no retained factors or
   * preceding-call warm state.
   *
   * Status 1 is Solved, 2/3 are primal/dual infeasibility, 4 is AlmostSolved;
   * 5/6 are reduced-accuracy infeasibility, 7 is the iteration limit, 9 is
   * numerical refusal and 10 is insufficient progress. Only status 1 means full
   * convergence. Zero variables return negative API status with unavailable
   * diagnostics as NaN. Unsuccessful vectors must not be accepted as geometry.
   * Historical native transport and bytes remain in repository history, outside
   * shipped product paths.
   */
  export type IResult = {
    /**
     * 1 full convergence; 2/3 primal/dual infeasibility; 4 almost solved; 5/6
     * reduced-accuracy infeasibility; 7 iteration limit; 9 numerical refusal;
     * 10 insufficient progress; -1 empty-variable API refusal.
     */
    status: number;
    /**
     * Interior-point iterations performed, zero for empty-variable refusal;
     * this is work performed rather than a convergence certificate.
     */
    iterations: number;
    /**
     * Normalized primal feasibility residual in original problem scaling; NaN
     * when setup cannot provide a measurement.
     */
    primalResidual: number;
    /**
     * Normalized dual stationarity residual in original problem scaling; NaN
     * when setup cannot provide a measurement.
     */
    dualResidual: number;
    /**
     * Reported primal objective in the caller's objective units; unavailable or
     * infeasible-result costs may be NaN.
     */
    objective: number;
    /**
     * Reported dual objective in the caller's objective units; unavailable or
     * infeasible-result costs may be NaN.
     */
    dualObjective: number;
    /**
     * Copied variable vector in original variable order and scaling; only
     * status 1 admits it as a converged solution.
     */
    primal: number[];
    /**
     * Copied multipliers in original interval-row order after recombining
     * expanded cone rows; failure vectors must not be interpreted as admitted
     * geometry.
     */
    dual: number[];
  };
}
