/**
 * A worker request to solve the arms-down pose for a body document.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the arms-down solve the editor applies to the draft.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Runs the solve on the resident worker as its own transaction.
 * @author Samchon
 */
export interface IConnectedBodyArmsDownRequest {
  /**
   * Request kind.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Selects the arms-down solve.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates the request with its solved-pose reply.
   */
  operation: "armsDown";

  /**
   * Serialized document whose arms are solved.
   *
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Solves against the current draft's shape and pose.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Transports the draft as text through the worker boundary.
   */
  document: string;
}
