/**
 * The simple body runtime's result or refusal for one correlated operation. The transport rejects a reply carrying `error`; otherwise it resolves `result` as the operation caller's requested type. This envelope does not validate that result or require it to be present.
 *
 * @evidence contracts/common.md#principled-implementation A numeric request ID correlates the result with its pending operation, while an optional error string follows the worker's exception-to-message protocol; result typing remains operation-specific.
 * @evidence contracts/common.md#clear-and-simple-design One reply envelope serves expansion, projection and measured-channel inversion because the pending request already knows which numerical result it expects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown result data is explicitly exposed as unknown rather than certified by this structural envelope; the transport's generic cast remains an unchecked protocol assumption.
 * @evidence contracts/common.md#meaningful-documentation The comment states error precedence, caller-owned result typing and the absence of runtime payload validation, including that result may be missing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reply shape contains no dispatch or correlation algorithm; the transport performs its pending-request lookup by ID.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A reply identifies one operation and cannot establish equivalence with another; this envelope caches no successful or refused result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No worker or promise is acquired by the reply declaration; delivery removes the corresponding pending request in the transport owner.
 *
 * @author Samchon
 */
export interface IBodySimpleReply {
  /** Original operation's correlation identity. */
  id: number;

  /** Numerical result; the operation-specific caller owns its type. */
  result?: unknown;

  /** Reported numerical refusal; omission leaves the result alternative. */
  error?: string;
}
