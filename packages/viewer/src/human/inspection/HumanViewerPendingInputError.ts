/**
 * An input that is not yet decided, as opposed to refused: a sidecar still
 * being read off the request path, or a document awaiting its owner's
 * admission in the page. The catalogue lists it with `pending: true`, so a
 * client waits for it instead of treating it as a refusal.
 *
 * @evidence contracts/common.md#principled-implementation readHumanViewerInputs uses this Error subtype to preserve a not-yet-decided sidecar/admission outcome, which catalogue projection marks pending instead of refusing a valid future input.
 * @evidence contracts/common.md#clear-and-simple-design Keeps undecided input identity separate from invalid input identity so readHumanViewerShowCatalogue can wait for the responsible owner rather than treating an incomplete read as permanent failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending follows unresolved owner work, not a guessed timeout or a silent fallback document; constructing this error does not imply future admission will succeed.
 * @evidence contracts/common.md#meaningful-documentation Names the undecided sidecar/admission cases and pending catalogue semantics, with no invented completion or retry deadline.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inherits Error allocation; sidecar reading, document enumeration and owner admission execute in their readers and numerical endpoints.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pending state is not an admitted document cache entry; the catalogue must observe the owner's later decision before exposing a selectable input.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reason and runtime stack remain with referenced refusal records; this subclass creates no timer or read task and imposes no error-message length cap.
 */
export class HumanViewerPendingInputError extends Error {}
