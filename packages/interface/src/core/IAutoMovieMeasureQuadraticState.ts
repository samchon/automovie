/** Data and callback contracts shared by the MeasureQuadraticState operations. */
export namespace IAutoMovieMeasureQuadraticState {
  /**
   * Measure homogeneous equations and original-coordinate termination
   * quantities. Residual signs are rx=-Px-A'z-q_tau and rz=Ax+s-b_tau. Costs
   * divide by tau and undo objective scaling; infeasibility quantities remain
   * homogeneous. Stable Euclidean norms retain the preceding solver's residual
   * definitions. Product/addition corrections remain through sparse residuals
   * and costs; the gap is formed before the two reported costs round to
   * individual numbers.
   */
  export type IResult = {
    /**
     * Homogeneous dual equation residual -P_x - Aᵀ_z - q*tau in equilibrated
     * solver coordinates; fresh array of n variable components.
     */
    rx: Float64Array;
    /**
     * Homogeneous primal equation residual A_x + s - b_tau in equilibrated
     * solver coordinates; fresh array of m expanded constraint components.
     */
    rz: Float64Array;
    /**
     * Homogeneous scalar residual qᵀ_x + bᵀ_z + xᵀ_P_x/tau + kappa, retaining
     * twofold dot-product corrections until publication.
     */
    rt: number;
    /**
     * Qᵀ*x in the current equilibrated homogeneous coordinates, before division
     * by tau or objective scale c.
     */
    qx: number;
    /**
     * Bᵀ*z in the current equilibrated homogeneous coordinates, before
     * objective rescaling.
     */
    bz: number;
    /**
     * Sᵀ*z complementarity dot product in the current homogeneous cone
     * coordinates.
     */
    sz: number;
    /**
     * Xᵀ_P_x in the current equilibrated homogeneous coordinates, before
     * dividing by tau squared.
     */
    xpx: number;
    /**
     * Primal cost (qᵀ_x/tau + xᵀ_P_x/(2_tau²))/c in the caller's original
     * objective scale.
     */
    objective: number;
    /**
     * Dual cost (-bᵀ_z/tau - xᵀ_P_x/(2_tau²))/c in the caller's original
     * objective scale.
     */
    dualObjective: number;
    /**
     * Euclidean primal equation norm after undoing row and homogeneous scaling,
     * normalized by max(1, normb + (normx + norms)/tau).
     */
    primalResidual: number;
    /**
     * Euclidean dual equation norm after undoing variable, homogeneous and
     * objective scaling, normalized by max(1, normq + (normx + normz)/tau).
     */
    dualResidual: number;
    /**
     * Scaled norm of Aᵀ_z divided by max(1, normz), measured before adding P_x
     * and q*tau; a certificate residual, not a solved primal constraint error.
     */
    primalInfeasibility: number;
    /**
     * Maximum normalized certificate residual of P_x and A_x+s, measured before
     * adding the homogeneous right-hand sides.
     */
    dualInfeasibility: number;
    /**
     * Absolute primal-minus-dual objective gap in original objective units,
     * formed from compensated costs before each reported objective rounds.
     */
    gap: number;
    /**
     * Gap divided by max(1, min(abs(objective), abs(dualObjective)));
     * nonnegative when the measurement is finite.
     */
    relativeGap: number;
    /**
     * Current homogeneous embedding ratio kappa/tau, used with residuals for
     * termination and infeasibility decisions.
     */
    ratio: number;
  };
}
