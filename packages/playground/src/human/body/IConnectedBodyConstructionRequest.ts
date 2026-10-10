/**
 * Request the source owner's full construction and its separate admission report.
 * The numerical document retains the normal schema; this is a distinct product
 * operation, not a flag disabling its owner's checks.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the selected Body or Person owner's complete model while keeping its draft separate from committed preview history.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates draft construction from accepted preview transactions.
 * @author Samchon
 */
export interface IConnectedBodyConstructionRequest {
  /** Select full construction with normal admission recorded alongside it. */
  operation: "construct";

  /** Original numerical document, admitted by the product owner. */
  document: string;
}
