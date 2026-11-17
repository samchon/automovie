/** Data and callback contracts shared by the MeasureQuadraticState operations. */
export namespace IAutoMovieMeasureQuadraticState {
  /**
   * Measure homogeneous equations and original-coordinate termination quantities.
   * Residual signs are rx=-Px-A'z-q*tau and rz=Ax+s-b*tau. Costs divide by tau
   * and undo objective scaling; infeasibility quantities remain homogeneous.
   * Stable Euclidean norms retain the preceding solver's residual definitions.
   * Product/addition corrections remain through sparse residuals and costs; the
   * gap is formed before the two reported costs round to individual numbers.
   */
  export type IResult = {
    /** Homogeneous dual equation residual -P*x - Aᵀ*z - q*tau in equilibrated solver coordinates; fresh array of n variable components. */
    rx: Float64Array;
    /** Homogeneous primal equation residual A*x + s - b*tau in equilibrated solver coordinates; fresh array of m expanded constraint components. */
    rz: Float64Array;
    /** Homogeneous scalar residual qᵀ*x + bᵀ*z + xᵀ*P*x/tau + kappa, retaining twofold dot-product corrections until publication. */
    rt: number;
    /** qᵀ*x in the current equilibrated homogeneous coordinates, before division by tau or objective scale c. */
    qx: number;
    /** bᵀ*z in the current equilibrated homogeneous coordinates, before objective rescaling. */
    bz: number;
    /** sᵀ*z complementarity dot product in the current homogeneous cone coordinates. */
    sz: number;
    /** xᵀ*P*x in the current equilibrated homogeneous coordinates, before dividing by tau squared. */
    xpx: number;
    /** Primal cost (qᵀ*x/tau + xᵀ*P*x/(2*tau²))/c in the caller's original objective scale. */
    objective: number;
    /** Dual cost (-bᵀ*z/tau - xᵀ*P*x/(2*tau²))/c in the caller's original objective scale. */
    dualObjective: number;
    /** Euclidean primal equation norm after undoing row and homogeneous scaling, normalized by max(1, normb + (normx + norms)/tau). */
    primalResidual: number;
    /** Euclidean dual equation norm after undoing variable, homogeneous and objective scaling, normalized by max(1, normq + (normx + normz)/tau). */
    dualResidual: number;
    /** Scaled norm of Aᵀ*z divided by max(1, normz), measured before adding P*x and q*tau; a certificate residual, not a solved primal constraint error. */
    primalInfeasibility: number;
    /** Maximum normalized certificate residual of P*x and A*x+s, measured before adding the homogeneous right-hand sides. */
    dualInfeasibility: number;
    /** Absolute primal-minus-dual objective gap in original objective units, formed from compensated costs before each reported objective rounds. */
    gap: number;
    /** gap divided by max(1, min(abs(objective), abs(dualObjective))); nonnegative when the measurement is finite. */
    relativeGap: number;
    /** Current homogeneous embedding ratio kappa/tau, used with residuals for termination and infeasibility decisions. */
    ratio: number;
  };
}
