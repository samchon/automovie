/**
 * Actual owned numerical process failure, distinct from a rejected document.
 *
 * @evidence contracts/common.md#principled-implementation Carries a terminal owned-process/checked-loader failure and optional original stack/source-change classification.
 * @evidence contracts/common.md#clear-and-simple-design Separates execution failure from a domain document refusal or correlated unsuccessful model reply.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts sourceChanged is a host-observed classification and can be absent; a generic error message cannot independently prove byte mismatch.
 * @evidence contracts/common.md#meaningful-documentation Documents original cause/stack and measured source/config membership difference, with unchanged errors preserved through browser reconstruction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The payload performs no classification; the service compares current revision/witnesses and encodes the failure envelope.
 * @evidence contracts/performance.md#reuse-equivalent-work A terminal failure ends its endpoint and pending requests; failed work is not replayed from another source or cached merely by message equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Error strings/stacks live with the event/client until retirement, uncapped in size; the server still owns actual child close.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalFailure {
  /**
   * Terminal execution-failure message discriminant, separate from document admission refusal.
   */
  type: "failure";

  /** Original process or checked-loader error message. */
  error: string;

  /** Original stack when the execution owner supplies one. */
  stack?: string;

  /**
   * Host measured different startup source/configuration bytes or membership.
   */
  sourceChanged?: boolean;
}
