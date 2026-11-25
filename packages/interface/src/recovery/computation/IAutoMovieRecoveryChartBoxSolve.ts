/**
 * Minimize sum_axis(0.5_x' H x - rhs' x) on the supplied original control box.
 * H is an exactly symmetric sparse positive-semidefinite Gram matrix supplied
 * by the caller. This helper validates finite entries, distinct sparse
 * addresses, reciprocal symmetry and nonnegative diagonals; it does not certify
 * PSD or rank. An exactly zero diagonal requires an exactly zero row and three
 * zero RHS entries. Such an unseen coordinate uses scale one and retains its
 * feasible initial value. Dii=1/sqrt(Hii), x=Dy, Hs=DHD and bs=Db give the same
 * real-arithmetic objective and box after scaling. FISTA projects in y, with
 * objective-based momentum restarts. Numeric scaling is binary64; failed
 * finite/feasible transformations throw rather than adding a regularizer or
 * perturbing H. Active bounds retain original endpoints. Termination uses the
 * original infinity norm of G_L(x)=L_(x-proj(x-gradient/L)). An equivalent
 * component formula avoids cancellation of two nearly equal x values. The best
 * finite feasible original objective is returned, with its own gradient metric;
 * exhausting the attempt budget is not convergence. Iterations counts all
 * projected proposals, including rejected momentum attempts. Empty systems
 * return empty. The attempt budget is a positive safe integer and gradient
 * tolerance is finite and nonnegative. Reported gradients/objectives are
 * binary64 evaluations, not exact KKT, uniqueness, eigenvalue or geometric
 * accuracy certificates. Optional initialValues are copied original normalized
 * coordinates, interleaved by three axes per control. They must be finite and
 * feasible without clipping; omission starts at projected zero.
 * initialObjective records their original Q, and every invocation starts with
 * fresh momentum and retains that feasible best.
 */

export namespace IAutoMovieRecoveryChartBoxSolve {
  /**
   * Minimize sum_axis(0.5_x' H x - rhs' x) on the supplied original control
   * box. H is an exactly symmetric sparse positive-semidefinite Gram matrix
   * supplied by the caller. This helper validates finite entries, distinct
   * sparse addresses, reciprocal symmetry and nonnegative diagonals; it does
   * not certify PSD or rank. An exactly zero diagonal requires an exactly zero
   * row and three zero RHS entries. Such an unseen coordinate uses scale one
   * and retains its feasible initial value. Dii=1/sqrt(Hii), x=Dy, Hs=DHD and
   * bs=Db give the same real-arithmetic objective and box after scaling. FISTA
   * projects in y, with objective-based momentum restarts. Numeric scaling is
   * binary64; failed finite/feasible transformations throw rather than adding a
   * regularizer or perturbing H. Active bounds retain original endpoints.
   * Termination uses the original infinity norm of
   * G_L(x)=L_(x-proj(x-gradient/L)). An equivalent component formula avoids
   * cancellation of two nearly equal x values. The best finite feasible
   * original objective is returned, with its own gradient metric; exhausting
   * the attempt budget is not convergence. Iterations counts all projected
   * proposals, including rejected momentum attempts. Empty systems return
   * empty. The attempt budget is a positive safe integer and gradient tolerance
   * is finite and nonnegative. Reported gradients/objectives are binary64
   * evaluations, not exact KKT, uniqueness, eigenvalue or geometric accuracy
   * certificates. Optional initialValues are copied original normalized
   * coordinates, interleaved by three axes per control. They must be finite and
   * feasible without clipping; omission starts at projected zero.
   * initialObjective records their original Q, and every invocation starts with
   * fresh momentum and retains that feasible best.
   */

  export type Operation = (input: {
    /**
     * Sparse symmetric Hessian rows; each entry stores a column index and its
     * numeric coefficient.
     */
    hessian: readonly (readonly (readonly [number, number])[])[];

    /**
     * Assembled normalized right-hand-side values in the same unknown-slot
     * order as the Hessian.
     */
    rhs: readonly number[];

    /** Lower componentwise control bound in the normalized solver chart. */
    lower: readonly [number, number, number];

    /** Upper componentwise control bound in the normalized solver chart. */
    upper: readonly [number, number, number];

    /**
     * Explicit positive numerical iteration ceiling; exhaustion remains a
     * reported termination, not convergence.
     */
    maxIterations: number;

    /**
     * Positive dimensionless projected-gradient termination threshold in the
     * solver's normalized chart.
     */
    gradientTolerance: number;

    /**
     * Optional feasible starting values in solver coordinates; omission uses
     * the declared solver initialization.
     */
    initialValues?: readonly number[];
  }) => {
    /**
     * Owned scalar solution values in the operation's declared coefficient
     * ordering and units.
     */
    values: Float64Array;

    /**
     * Actual numerical iterations attempted, including iterations without an
     * accepted update.
     */
    iterations: number;

    /**
     * Infinity norm of the normalized projected-gradient mapping used for
     * termination.
     */
    projectedGradient: number;

    /** Actual acceleration-momentum resets after objective increase. */
    restarts: number;

    /**
     * Current normalized quadratic objective value under the declared row
     * weights.
     */
    objective: number;

    /** The same normalized quadratic objective before iterative updates. */
    initialObjective: number;

    /**
     * Smallest positive Hessian diagonal; null means no positive entry was
     * observed.
     */
    minimumPositiveDiagonal: number | null;

    /** Largest Hessian diagonal used in scaling and diagnostics. */
    maximumDiagonal: number;

    /**
     * Row-sum spectral upper estimate for the original Hessian, not a condition
     * number.
     */
    originalLipschitz: number;

    /**
     * Row-sum spectral upper estimate after diagonal congruence, not a
     * condition number.
     */
    scaledLipschitz: number;
  };
}
