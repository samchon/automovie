/** A request that arrived before the resident page reported its renderer; the server answers 503 and the caller retries. */
export class HumanViewerStartingError extends Error {}
