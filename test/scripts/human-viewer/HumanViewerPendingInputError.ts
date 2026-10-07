/**
 * An input that is not yet decided, as opposed to refused: a sidecar still
 * being read off the request path, or a document awaiting its owner's
 * admission in the page. The catalogue lists it with `pending: true`, so a
 * client waits for it instead of treating it as a refusal.
 */
export class HumanViewerPendingInputError extends Error {}
