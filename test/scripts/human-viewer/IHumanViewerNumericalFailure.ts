/** Actual owned numerical process failure, distinct from a rejected document. @author Samchon */
export interface IHumanViewerNumericalFailure {
  type: "failure";

  /** Original process or checked-loader error message. */
  error: string;

  /** Original stack when the execution owner supplies one. */
  stack?: string;
}
