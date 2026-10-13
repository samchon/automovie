/**
 * Actual owned numerical process failure, distinct from a rejected document.
 *
 * @evidence contracts/common.md#principled-implementation Process failure is separate from document refusal and preserves the original execution cause.
 * @evidence contracts/common.md#clear-and-simple-design Error, optional stack and source-change witness form one terminal execution report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only measured source-byte or membership changes set sourceChanged; elapsed time is not that evidence.
 * @evidence contracts/common.md#meaningful-documentation Missing stack means the execution owner supplied none, and sourceChanged is a host-measured authority failure.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Process failure is separate from document refusal and preserves the original execution cause.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Only measured source-byte or membership changes set sourceChanged; elapsed time is not that evidence.
 * @author Samchon
 */
export interface IHumanViewerNumericalFailure {
  /**
   * Terminal execution-failure message discriminant, separate from document admission refusal.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Marks actual owned-process failure separately from domain document refusal.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Marks actual owned-process failure separately from domain document refusal.
   */
  type: "failure";

  /**
   * Original process or checked-loader error message.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves the original process or checked-loader error instead of a manufactured model result.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves the original process or checked-loader error instead of a manufactured model result.
   */
  error: string;

  /**
   * Original stack when the execution owner supplies one.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Retains the execution owner's original stack when available and does not invent one when absent.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Retains the execution owner's original stack when available and does not invent one when absent.
   */
  stack?: string;

  /**
   * Host measured different startup source/configuration bytes or membership.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Identifies a measured startup source-byte or membership change rather than inferring source failure from elapsed time.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Identifies a measured startup source-byte or membership change rather than inferring source failure from elapsed time.
   */
  sourceChanged?: boolean;
}
