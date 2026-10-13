/**
 * Actual owned numerical process failure, distinct from a rejected document.
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
