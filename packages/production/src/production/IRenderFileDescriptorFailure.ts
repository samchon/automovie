/**
 * Preserve a render read failure while its descriptor is being closed.
 *
 * @evidence contracts/common.md#principled-implementation Holds even a non-Error thrown value so closeRenderFileDescriptor can preserve it beside a cleanup failure rather than silently replacing its cause.
 * @evidence contracts/common.md#clear-and-simple-design A one-field carrier connects the project render reader's catch/finally scopes to the close owner; it carries no descriptor or retry policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown failures are retained unchanged instead of converted into strings or mistaken for successful reads.
 * @evidence contracts/common.md#meaningful-documentation Names the read/close boundary and arbitrary thrown-value ownership; absence of the carrier means no earlier failure was captured.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This carrier selects no read or cleanup algorithm; the render reader and close owner execute those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One failure occurrence has no equivalence proof for another read or descriptor.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous read scope owns the carrier and its referenced thrown value; this type acquires no handle or task.
 * @author Samchon
 */
export interface IRenderFileDescriptorFailure {
  /** Original thrown value retained unchanged until descriptor cleanup completes. */
  error: unknown;
}
