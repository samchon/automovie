import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoverySceneCheckpointCompletionOperation,
  IAutoMovieRecoverySceneWork,
} from "../../index";

/**
 * Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call carries the preceding report and is distinguished by phase, not nullness. The private target transfers diagnostics only when the seed is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call
 * @evidence contracts/development/design.md#principled-representation Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoverySceneSeedReportObserver share IAutoMovieRecoverySceneSeedReportObserverCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoverySceneSeedReportObserverCreationOperation {
  /**
   * Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call carries the preceding report and is distinguished by phase, not nullness. The private target transfers diagnostics only when the seed is refused.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call
   * @evidence contracts/development/design.md#principled-representation Preserve the last completed initial joint report until seed qualification. Completion calls this observer before and after each fit; a later before call
   * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoverySceneSeedReportObserver share IAutoMovieRecoverySceneSeedReportObserverCreationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    target: Pick<IAutoMovieRecoveryCameraSceneEstimate, "refusedSeedJoint">,
    work: IAutoMovieRecoverySceneWork,
    budget: IAutoMovieRecoveryCameraSceneBudget,
  ) => NonNullable<
    Parameters<IAutoMovieRecoverySceneCheckpointCompletionOperation.Operation>[8]
  >;
}
