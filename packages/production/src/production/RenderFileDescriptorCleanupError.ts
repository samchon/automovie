/**
 * Native aggregate preserving render read and descriptor-close failures in order.
 *
 * @evidence contracts/common.md#principled-implementation A distinct AggregateError identity lets the close owner flatten only its own prior cleanup aggregate while preserving unrelated thrown AggregateErrors as original causes.
 * @evidence contracts/common.md#clear-and-simple-design The subclass changes no native constructor behavior; closeRenderFileDescriptor owns cause ordering and message attribution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prior cause is discarded or reclassified and no descriptor-specific exception suppresses cleanup failure.
 * @evidence contracts/common.md#meaningful-documentation States aggregate ownership and flattening scope; native message, stack and errors behavior remains inherited.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This identity defines no aggregation traversal; the close owner constructs the explicit cause list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cleanup aggregates describe one operation's failures rather than reusable successful read observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catcher owns the aggregate and its cause references; the error object itself owns no open descriptor or task.
 */
export class RenderFileDescriptorCleanupError extends AggregateError {}
