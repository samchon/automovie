/**
 * Request the source owner's full construction and its separate admission report.
 * The numerical document retains the normal schema; this is a distinct product
 * operation, not a flag disabling its owner's checks.
 *
 * @author Samchon
 */
export interface IConnectedBodyConstructionRequest {
  /** Select full construction with normal admission recorded alongside it. */
  operation: "construct";

  /** Original numerical document, admitted by the product owner. */
  document: string;
}
