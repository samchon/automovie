/** A request refused because the GPU queue is full; the server answers 503 with the reason. */
export class HumanViewerQueueFullError extends Error {}
