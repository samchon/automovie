import type { ConnectedPersonWorkerEnd } from "./ConnectedPersonWorkerEnd";

/**
 * The two ends of the one resident person worker: the preview transport's and
 * the measurement transport's. Each call returns the end of the live worker,
 * starting a new worker when none is alive.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Gives the person editor's preview and measurement one worker and one read of the source.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Lets either transport recover by asking for the end of a fresh worker.
 * @author Samchon
 */
export interface IConnectedPersonWorkerShare {
  /** The end that carries preview, construction and export requests. */
  preview(): ConnectedPersonWorkerEnd;

  /** The end that carries measurement requests. */
  measure(): ConnectedPersonWorkerEnd;
}
