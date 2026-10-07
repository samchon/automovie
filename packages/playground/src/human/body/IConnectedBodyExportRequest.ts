/**
 * A worker request to encode the committed body document as static GLB.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Requests a static file only on explicit export.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Sends the committed document to the static exporter.
 * @author Samchon
 */
export interface IConnectedBodyExportRequest {
  /**
   * Request kind.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Selects the explicit export operation.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Correlates the request with its GLB reply.
   */
  operation: "export";

  /**
   * Serialized committed document to export.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Exports the committed document, not a pending draft.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Transports the committed document as text through the worker boundary.
   */
  document: string;
}
