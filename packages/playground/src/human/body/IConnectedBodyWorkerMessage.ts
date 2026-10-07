import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";

/**
 * One request the body editor posts to a body-protocol worker.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries one preview, export or arms-down request from the editor to its body worker.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates each worker request with its transaction by id.
 * @author Samchon
 */
export interface IConnectedBodyWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request. */
  input: ConnectedBodyRequest;
}
