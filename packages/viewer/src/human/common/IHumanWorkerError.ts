/**
 * A normalized native worker failure delivered to the request owner.
 *
 * @evidence contracts/common.md#principled-implementation The adapter normalizes native transport failure to available message text; the resident coordinator uses it to reject pending requests and invalidate the current connection.
 * @evidence contracts/common.md#clear-and-simple-design One text field is the portable failure seam, keeping browser ErrorEvent details outside numerical request coordination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing host detail uses the caller's domain fallback through humanWorkerErrorMessage; no successful numerical result is manufactured from an error event.
 * @evidence contracts/common.md#meaningful-documentation The field states available native reason or transport fallback and does not claim preservation of stack, source location or the original Error identity.
 * @evidence contracts/performance.md#efficient-algorithms Message normalization is constant field access plus text conversion; the coordinator's subsequent failure fan-out scales with pending request count.
 * @evidence contracts/performance.md#reuse-equivalent-work One transport failure invalidates its current connection; identical message strings on another connection are independent events rather than reusable completions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record contains only failure text. The coordinator owns pending rejection and termination; this type retains no native event object or connection.
 *
 * @author Samchon
 */
export interface IHumanWorkerError {
  /** Available native failure reason, or the transport's domain fallback. */
  message: string;
}
