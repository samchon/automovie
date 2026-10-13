/**
 * Actual owned numerical process failure, distinct from a rejected document.
 *
 * @evidence contracts/common.md#principled-implementation Process failure is separate from document refusal and preserves the original execution cause.
 * @evidence contracts/common.md#clear-and-simple-design Error, optional stack and source-change witness form one terminal execution report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only measured source-byte or membership changes set sourceChanged; elapsed time is not that evidence.
 * @evidence contracts/common.md#meaningful-documentation Missing stack means the execution owner supplied none, and sourceChanged is a host-measured authority failure.
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
