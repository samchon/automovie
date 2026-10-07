/**
 * A worker request for one numerical preview of a body document.
 *
 * `measure` asks for surface crossings and `anatomy` for the humeral head
 * reading; the reply's buffers belong to this transaction.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the body's numerical preview independently of file encoding.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates preview transactions from file requests.
 * @author Samchon
 */
export interface IConnectedBodyPreviewRequest {
  /**
   * Request kind.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Selects the preview operation.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates the request with its preview reply.
   */
  operation: "preview";

  /**
   * Serialized document to evaluate.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Sends the current draft to the resident builder.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Transports the draft as text through the worker boundary.
   */
  document: string;

  /**
   * Whether surface crossings are read for this preview.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the on-demand contact check.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps crossing measurement optional per transaction.
   */
  measure: boolean;

  /**
   * Whether the humeral head reading is produced.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the anatomy reading shown beside the preview.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the anatomy reading optional per transaction.
   */
  anatomy?: boolean;
}
