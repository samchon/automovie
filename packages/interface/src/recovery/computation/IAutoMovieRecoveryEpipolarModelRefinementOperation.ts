import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraPoseRefinementOperation,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
} from "../../index";

/**
 * Refine a calibrated consensus candidate with at most three inlier refits.
 * Each fixed-subset optimizer must terminate, and the final inlier population
 * must stabilize within this declared refit budget. A changed subset never
 * inherits a previous local convergence claim.
 */

export namespace IAutoMovieRecoveryEpipolarModelRefinementOperation {
  /**
   * Refine a calibrated consensus candidate with at most three inlier refits.
   * Each fixed-subset optimizer must terminate, and the final inlier population
   * must stabilize within this declared refit budget. A changed subset never
   * inherits a previous local convergence claim.
   */

  export type Operation = (
    matrix: readonly number[],
    initialScore: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>,
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    policy: IAutoMovieRecoveryCameraPairInput["policy"],
    budget: IAutoMovieRecoveryCameraPairInput["budget"],
  ) => {
    /**
     * Row-major 3 by 3 epipolar model in the declared image charts; homogeneous
     * scale is arbitrary.
     */
    matrix: number[];

    /**
     * Residual-gated original correspondence indices and their pixel quantiles
     * for the current model.
     */
    score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;

    /**
     * Pose-refinement attempts retained in execution order, including
     * unsuccessful termination.
     */
    fits: ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[];

    /**
     * True only when the stated numerical termination predicate was met; it
     * does not certify scene geometry.
     */
    converged: boolean;

    /**
     * Explicit refinement failure category, or null when the requested
     * refinement was admitted.
     */
    refusal:
      | "optimizer-termination"
      | "inlier-refit-budget"
      | "insufficient-refined-support"
      | null;
  };
}
