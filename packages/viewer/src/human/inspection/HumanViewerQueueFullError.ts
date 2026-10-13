/**
 * A request refused because its GPU waiting lane is full; the server answers
 * 503 with the queue owner's reason. The active request keeps its GPU slot.
 */
export class HumanViewerQueueFullError extends Error {}
