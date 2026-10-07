/**
 * The part of a browser worker a numerical transport uses. The shared person
 * worker hands each transport an object of this shape, so the existing
 * transports stay unaware that they share one worker.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Presents the shared person worker to each existing transport as its own worker.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps native event callbacks and termination behind the transport boundary.
 * @author Samchon
 */
export type ConnectedPersonWorkerEnd = Pick<
  Worker,
  "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
>;
