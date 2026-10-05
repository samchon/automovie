import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";

/** One request the body editor posts to a body-protocol worker. */
export interface IConnectedBodyWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request. */
  input: ConnectedBodyRequest;
}
