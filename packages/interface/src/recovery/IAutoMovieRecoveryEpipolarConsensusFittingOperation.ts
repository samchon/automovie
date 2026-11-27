import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarModelRefinementOperation,
} from "..";

/**
 * Estimate a calibrated pixel epipolar consensus with bounded local refinement.
 * Every proposal is projected to the supplied-calibration essential manifold
 * before scoring. The first bounded proposals with at least eight calibrated
 * inliers receive local refinement before comparison with the current winner; a
 * raw score cannot bound the result of local optimization. Final re-estimation
 * invalidates an older sampling target; any larger target resumes proposals
 * within the same total trial budget.
 */

export namespace IAutoMovieRecoveryEpipolarConsensusFittingOperation {
  /**
   * Estimate a calibrated pixel epipolar consensus with bounded local
   * refinement. Every proposal is projected to the supplied-calibration
   * essential manifold before scoring. The first bounded proposals with at
   * least eight calibrated inliers receive local refinement before comparison
   * with the current winner; a raw score cannot bound the result of local
   * optimization. Final re-estimation invalidates an older sampling target; any
   * larger target resumes proposals within the same total trial budget.
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
     * Row-major 3 by 3 epipolar model in the declared image charts; homogeneous
     * scale is arbitrary.
     */
    matrix: number[] | null;

    /**
     * Residual-gated original correspondence indices and their pixel quantiles
     * for the current model.
     */
    score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;

    /**
     * Actual random-sample hypotheses attempted under the caller's explicit
     * work ceiling.
     */
    trials: number;

    /**
     * Conditional trial requirement computed from final observed support, or
     * null when it is not representable.
     */
    requiredTrialsAtFinalSupport: number | null;

    /**
     * Whether actual trials met the conditional target; this is conditional on
     * the assumed sampling/support model.
     */
    conditionalTrialTargetMet: boolean;

    /** Attempted hypotheses rejected for numerical admission or degeneracy. */
    numericalRefusals: number;

    /** Number of local consensus refinements actually attempted. */
    localRefinements: number;

    /** Local refinements refused by numerical or support admission. */
    localRefinementRefusals: number;

    /** Actual final-support reestimations, separate from sampled hypotheses. */
    finalReestimations: number;

    /**
     * Last final-support refinement report, or null when no refinement was
     * admitted.
     */
    finalRefinement: ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> | null;
  };
}
