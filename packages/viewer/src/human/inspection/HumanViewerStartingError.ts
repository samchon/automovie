/**
 * A request that arrived before the resident page reported its renderer.
 * The server answers 503; the caller decides when to ask again. This refusal
 * establishes neither process death nor permission to replace the browser.
 */
export class HumanViewerStartingError extends Error {}
