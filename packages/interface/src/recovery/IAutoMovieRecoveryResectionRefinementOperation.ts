import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapPose,
} from "..";

/**
 * Refine one camera against a fixed existing 3D landmark population. Supplied
 * intrinsics and noisy triangulated points remain fixed, so this is a
 * conditional estimate before joint refinement. Soft-L1 weights use a complete
 * two-coordinate residual norm, with analytic SO3/additive-t derivatives.
 */

export namespace IAutoMovieRecoveryResectionRefinementOperation {
  /**
   * Refine one camera against a fixed existing 3D landmark population. Supplied
   * intrinsics and noisy triangulated points remain fixed, so this is a
   * conditional estimate before joint refinement. Soft-L1 weights use a
   * complete two-coordinate residual norm, with analytic SO3/additive-t
   * derivatives.
   */

  export type Operation = (
    initial: IAutoMovieRecoveryMapPose,
    points: readonly (readonly [number, number, number])[],
    pixels: readonly (readonly [number, number])[],
    intrinsic: readonly number[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
    checkpoint: () => void,
  ) => {
    /**
     * Last admitted camera pose, retaining the current map's coordinate and
     * gauge convention.
     */
    pose: IAutoMovieRecoveryMapPose;

    /**
     * True only when the stated numerical termination predicate was met; it
     * does not certify scene geometry.
     */
    converged: boolean;

    /**
     * Actual numerical iterations attempted, including iterations without an
     * accepted update.
     */
    iterations: number;

    /**
     * Number of candidate updates actually accepted by the objective and
     * feasibility checks.
     */
    acceptedSteps: number;

    /**
     * Robust objective evaluated at the supplied initial pose under the
     * unchanged observation policy.
     */
    initialCost: number;

    /** The same robust objective evaluated at the last accepted pose. */
    finalCost: number;

    /**
     * Smallest accepted normalized design singular ratio; dimensionless and
     * independent of residual magnitude.
     */
    minimumDesignRatio: number;

    /**
     * Predicate ending refinement; iteration-budget is an incomplete solve
     * rather than convergence.
     */
    termination: "gradient" | "step" | "cost" | "iteration-budget";
  };
}
