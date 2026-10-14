/**
 * A body-simple worker connection owned by one mounted page. Requests preserve queue order until their actual replies; close rejects queued and active callers and permanently prevents reconnection.
 *
 * @evidence contracts/common.md#principled-implementation The transport exposes correlated numerical requests separately from permanent closure so page retirement cannot leave unresolved callers or recreate a worker.
 * @evidence contracts/common.md#clear-and-simple-design A generic request entry and one lifetime boundary are sufficient for the simple service; native worker events remain adapter-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Request completion follows actual worker replies rather than elapsed-time guesses, and the generic result type remains a protocol assumption rather than runtime validation.
 * @evidence contracts/common.md#meaningful-documentation The handle comment explains queue order, close-time rejection, permanent shutdown and result-typing limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle declaration chooses no queue or correlation data structure itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type declares no merging of numerical requests with equal-looking payloads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The implementation owns connection and pending requests; this interface supplies their close boundary without allocating them.
 *
 * @author Samchon
 */
export interface IBodySimpleWorkerTransport {
  /**
   * Queue one operation and resolve its correlated reply as the caller's protocol type; reject on numerical or connection failure and after close.
   *
   * @evidence contracts/common.md#principled-implementation A correlated promise binds one operation's numerical reply or refusal to its caller without inferring completion from worker silence.
   * @evidence contracts/common.md#clear-and-simple-design One generic operation entry serves expansion, projection and detailed inversion through their existing discriminated payloads.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The generic result annotation does not validate unknown reply data, and a closed connection rejects rather than fabricating an answer.
   * @evidence contracts/common.md#meaningful-documentation The request comment identifies correlation, caller-owned protocol typing and numerical, transport and closed-state rejection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This request signature implements no queue progression or payload cloning algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Numerical asks remain separate effects; no cached or in-flight deduplication contract is declared.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transport provider retains requests until reply, failure or closure behind this promise-returning member.
   */
  ask: <Result>(request: object) => Promise<Result>;

  /**
   * Permanently close the connection, reject every pending request and terminate its native worker.
   *
   * @evidence contracts/common.md#principled-implementation Permanent closure rejects pending promises before native termination, withdrawing caller authority even if termination throws.
   * @evidence contracts/common.md#clear-and-simple-design One synchronous shutdown entry retires the owned connection without exposing its maps or browser handlers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closing does not claim a successful numerical result or permit the next request to silently reconnect.
   * @evidence contracts/common.md#meaningful-documentation The member states permanent shutdown, pending rejection and native-worker termination.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close declaration chooses no pending-request traversal or error-propagation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Closure is an ownership effect rather than shared numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The native worker and request population belong to the provider that implements this shutdown entry.
   */
  close: () => void;
}
