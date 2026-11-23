/**
 * Residual Jacobian and finite box bounds for one damped target-search
 * direction.
 */
export namespace IAutoMovieSolvePhysicalTargetStep {
  /**
   * Finite residual Jacobian and box-constrained coordinates for one damped
   * linear search direction.
   *
   * Each column has errors.length rows and corresponds to one coordinate; at
   * most 64 columns are allowed. Damping is positive in the Jacobian's
   * singular-value units. solvePhysicalTargetStep borrows arrays and returns a
   * new coordinate-delta vector; the nonlinear caller owns applying it,
   * clamping candidate coordinates and backtracking against actual residuals.
   * The producer rejects empty/nonfinite errors, mismatched dimensions, invalid
   * bounds or an out-of-bounds current value. Zero columns or fixed coordinates
   * yield zero directions rather than guaranteed progress.
   */
  export type IInput = {
    /**
     * Finite residual-derivative columns, one per coordinate and one entry per
     * error row, with at most 64 columns.
     */
    columns: readonly (readonly number[])[];

    /**
     * Nonempty finite residual vector in the caller's common residual unit,
     * metres for articulation fitting.
     */
    errors: readonly number[];

    /** Current coordinates and inclusive limits. */
    coordinates: readonly {
      /**
       * Finite current coordinate within its inclusive minimum and maximum, in
       * the caller's coordinate unit (joint radians for articulation fitting).
       */
      value: number;

      /** Finite inclusive lower coordinate bound in the same unit as value. */
      minimum: number;

      /**
       * Finite inclusive upper coordinate bound, at least minimum; equality
       * fixes this coordinate.
       */
      maximum: number;
    }[];

    /** Positive damping in Jacobian units. */
    damping: number;
  };
}
