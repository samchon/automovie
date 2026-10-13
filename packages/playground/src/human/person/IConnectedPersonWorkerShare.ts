import type { ConnectedPersonWorkerEnd } from "./ConnectedPersonWorkerEnd";

/**
 * The two ends of the one resident person worker: the preview transport's and
 * the measurement transport's. Each call returns the end of the live worker,
 * starting a new worker when none is alive.
 *
 * @author Samchon
 */
export interface IConnectedPersonWorkerShare {
  /** The end that carries preview, construction and export requests. */
  preview(): ConnectedPersonWorkerEnd;

  /** The end that carries measurement requests. */
  measure(): ConnectedPersonWorkerEnd;
}
