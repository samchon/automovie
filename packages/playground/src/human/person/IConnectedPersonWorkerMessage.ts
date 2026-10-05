import type { ConnectedBodyRequest } from "../body/ConnectedBodyRequest";

/**
 * One request the person editor posts to its resident person worker: the
 * body editor's request protocol carrying a person document.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries one person-document request from the editor to its resident worker.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates each worker request with its transaction by id.
 * @author Samchon
 */
export interface IConnectedPersonWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request carrying a person document. */
  input: ConnectedBodyRequest;
}
