import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraPoseRefinementOperation,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
} from "..";

/**
 * Callable local refinement and inlier stabilization for a calibrated epipolar
 * model.
 */

export namespace IAutoMovieRecoveryEpipolarModelRefinementOperation {
  /**
   * Refine the pose on the current fixed support and score signed Sampson
   * residuals for all tentative pairs. Repeat at most three fixed-support fits
   * when the index set changes. Complete only when the last fit converges and
   * the reclassified support is unchanged.
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
    /** Current calibrated row-major pixel fundamental matrix. */
    matrix: number[];

    /** Latest measured support ordinals and accepted pixel residual statistics. */
    score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;

    /** Completed fixed-subset optimizer reports in execution order. */
    fits: ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[];

    /** True when a converged fixed-subset fit leaves the same support indices. */
    converged: boolean;

    /**
     * Observed optimization, support or refit-cap refusal, or null after
     * stabilization.
     */
    refusal:
      | "optimizer-termination"
      | "inlier-refit-budget"
      | "insufficient-refined-support"
      | null;
  };
}
