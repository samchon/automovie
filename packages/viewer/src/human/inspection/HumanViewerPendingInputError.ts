/**
 * An input that is not yet decided, as opposed to refused: a sidecar still
 * being read off the request path, or a document awaiting its owner's
 * admission in the page. The catalogue lists it with `pending: true`, so a
 * client waits for it instead of treating it as a refusal.
 *
 * @evidence contracts/common.md#principled-implementation The pending identity distinguishes an undecided owner verdict from a rejected numerical document.
 * @evidence contracts/common.md#clear-and-simple-design A dedicated Error subtype lets callers classify pending admission without parsing a diagnostic string.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the unresolved-input state without admitting the document, estimating its geometry or replacing its owner verdict.
 * @evidence contracts/common.md#meaningful-documentation Names the sidecar and admission prerequisites and explains the catalogue's pending marker.
 */
export class HumanViewerPendingInputError extends Error {}
