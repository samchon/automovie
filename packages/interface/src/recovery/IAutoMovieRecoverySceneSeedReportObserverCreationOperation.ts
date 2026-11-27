import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoverySceneCheckpointCompletionOperation,
  IAutoMovieRecoverySceneWork,
} from "..";

/**
 * Preserve the last completed initial joint report until seed qualification.
 * Completion calls this observer before and after each fit; a later before call
 * carries the preceding report and is distinguished by phase, not nullness. The
 * private target transfers diagnostics only when the seed is refused.
 */

export namespace IAutoMovieRecoverySceneSeedReportObserverCreationOperation {
  /**
   * Preserve the last completed initial joint report until seed qualification.
   * Completion calls this observer before and after each fit; a later before
   * call carries the preceding report and is distinguished by phase, not
   * nullness. The private target transfers diagnostics only when the seed is
   * refused.
   */

  export type Operation = (
    target: Pick<IAutoMovieRecoveryCameraSceneEstimate, "refusedSeedJoint">,
    work: IAutoMovieRecoverySceneWork,
    budget: IAutoMovieRecoveryCameraSceneBudget,
  ) => NonNullable<
    Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[8]
  >;
}
