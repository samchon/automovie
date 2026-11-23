import type {
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryHomographyFittingOperation,
} from "../../index";

/**
 * Search a planar explanation of the final fixed epipolar-inlier population.
 * Four-point homographies compete with symmetric pixel transfer. Absence of a
 * dominant model requires the conditional trial target for the forbidden
 * overlap fraction, not the much weaker best homography's own support ratio. A
 * found forbidden overlap is sufficient refusal evidence and ends the search.
 */

export namespace IAutoMovieRecoveryHomographyConsensusFittingOperation {
  /**
   * Search a planar explanation of the final fixed epipolar-inlier population.
   * Four-point homographies compete with symmetric pixel transfer. Absence of a
   * dominant model requires the conditional trial target for the forbidden
   * overlap fraction, not the much weaker best homography's own support ratio.
   * A found forbidden overlap is sufficient refusal evidence and ends the
   * search.
   */

  export type Operation = (
    first: readonly (readonly [number, number])[],
    second: readonly (readonly [number, number])[],
    policy: IAutoMovieRecoveryCameraPairInput["policy"],
    budget: IAutoMovieRecoveryCameraPairInput["budget"],
    checkpoint: (completed: number, total: number) => void,
  ) => {
    /**
     * Last admitted homography, or null when no candidate survived numerical
     * and support admission.
     */
    model: ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> | null;

    /**
     * Residual-gated original correspondence indices and their pixel quantiles
     * for the current model.
     */
    score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;

    /** Number of correspondences in the admitted hypothesis population. */
    population: number;

    /**
     * Correspondence count meeting the declared forbidden planar overlap
     * criterion.
     */
    forbiddenSupport: number;

    /**
     * Actual random-sample hypotheses attempted under the caller's explicit
     * work ceiling.
     */
    trials: number;

    /**
     * Conditional trial requirement at the forbidden planar-support threshold,
     * or null when unavailable.
     */
    requiredTrialsAtForbiddenSupport: number | null;

    /**
     * Whether actual trials met the conditional target; this is conditional on
     * the assumed sampling/support model.
     */
    conditionalTrialTargetMet: boolean;

    /**
     * True when an admitted homography explains the forbidden support
     * population.
     */
    forbiddenOverlapFound: boolean;

    /** Attempted hypotheses rejected for numerical admission or degeneracy. */
    numericalRefusals: number;

    /** Hypothesis-support refits refused by numerical admission. */
    refitRefusals: number;
  };
}
