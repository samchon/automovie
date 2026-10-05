import type { ConnectedBodyRequest } from "../body/ConnectedBodyRequest";

/**
 * One request the person editor posts to its resident person worker: the
 * body editor's request protocol carrying a person document.
 *
 * @author Samchon
 */
export interface IConnectedPersonWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request carrying a person document. */
  input: ConnectedBodyRequest;
}
