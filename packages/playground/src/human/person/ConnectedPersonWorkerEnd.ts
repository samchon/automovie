/**
 * The part of a browser worker a numerical transport uses. The shared person
 * worker hands each transport an object of this shape, so the existing
 * transports stay unaware that they share one worker.
 *
 * @author Samchon
 */
export type ConnectedPersonWorkerEnd = Pick<
  Worker,
  "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
>;
