import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";

/**
 * One request the body editor posts to a body-protocol worker.
 *
 * @author Samchon
 */
export interface IConnectedBodyWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request. */
  input: ConnectedBodyRequest;
}
