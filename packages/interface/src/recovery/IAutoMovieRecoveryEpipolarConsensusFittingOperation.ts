import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarModelRefinementOperation,
} from "..";

/**
 * Callable bounded search and final refit for calibrated epipolar
 * correspondence evidence.
 */

export namespace IAutoMovieRecoveryEpipolarConsensusFittingOperation {
  /**
   * Draw deterministic distinct eight-point proposals, project each surviving
   * model into essential space, and score finite signed Sampson support. Try
   * eligible local refits within the declared limit. Recompute the sampling
   * target after final re-estimation and resume sampling when the new target
   * requires it and capacity remains.
   */

  export type Operation = (
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    policy: IAutoMovieRecoveryCameraPairInput["policy"],
    budget: IAutoMovieRecoveryCameraPairInput["budget"],
    checkpoint: (completed: number, total: number) => void,
  ) => {
    /**
     * Current calibrated row-major pixel fundamental matrix, or null without a
     * usable candidate.
     */
    matrix: number[] | null;

    /**
     * Current original-order support indices and finite pixel residual
     * statistics.
     */
    score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;

    /** Completed proposal draws, including recognized numerical refusals. */
    trials: number;

    /**
     * Ideal conditional trial target at the final support or null when a finite
     * target is unavailable.
     */
    requiredTrialsAtFinalSupport: number | null;

    /**
     * Whether proposal count met both the configured floor and final support
     * target.
     */
    conditionalTrialTargetMet: boolean;

    /** Numerically refused raw proposal fits. */
    numericalRefusals: number;

    /** Eligible proposals entering a bounded local refinement. */
    localRefinements: number;

    /**
     * Unfinished or numerically refused local refits and recognized numerical
     * exceptions from final re-estimation.
     */
    localRefinementRefusals: number;

    /** Final-support refit attempts, separate from proposal draws. */
    finalReestimations: number;

    /** Last available final-support refinement report, or null. */
    finalRefinement: ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> | null;
  };
}
