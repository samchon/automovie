/**
 * What a queued GPU task gets to stay bound to its HTTP client.
 *
 * @evidence contracts/common.md#principled-implementation Binds one HTTP client's abort signal to guarded page operations, checking loss before and after actual awaited settlement.
 * @evidence contracts/common.md#clear-and-simple-design Keeps client authority and operation guards separate from queue admission/physical GPU-slot ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Abort rejects requester authority without racing away the actual operation; only unfinished response close is client loss.
 * @evidence contracts/common.md#meaningful-documentation Documents signal, synchronous refusal check and settlement-preserving run; a request owns no independent renderer scheduler.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The capability performs no model work; fixed guard checks surround actual operations and queue tasks own their costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Each HTTP response has distinct abort authority; equal labels/operations cannot share this client-bound result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter removes its response listener when the queue promise settles, while running operation ownership remains until actual task finally.
 *
 * @author Samchon
 */
export interface IHumanViewerQueuedRequest {
  /** Aborted when the client disconnects before the response finished. */
  signal: AbortSignal;

  /**
   * Throws when the client is gone.
   *
   * @evidence contracts/common.md#principled-implementation Synchronously observes response destruction and throws its AbortSignal's original client-loss cause when authority is gone.
   * @evidence contracts/common.md#clear-and-simple-design One guard is reused before/after operations without exposing HTTP response internals to numerical/page consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A healthy completed response/body event is not mistaken for an unfinished disconnected client, and the guard does not stop physical GPU work.
   * @evidence contracts/common.md#meaningful-documentation Throws only the request's observed loss cause; callers must check before starting another operation.
   * @evidence contracts/performance.md#efficient-algorithms Fixed response/signal checks add no waiting-array or model traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The same request guard reads current transport state each time rather than memoizing an earlier connected observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The guard borrows its response/controller until request completion; listener cleanup and actual task lifetime stay with the adapter/queue.
   */
  check: () => void;

  /**
   * Runs one page operation to settlement, checking the client before and after.
   *
   * @evidence contracts/common.md#principled-implementation Checks client authority, awaits the supplied page operation to actual settlement, then checks authority again before returning its result.
   * @evidence contracts/common.md#clear-and-simple-design Keeps safe operation sequencing in one guard rather than racing AbortSignal against physical completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Client loss cannot release the GPU slot early; operation rejection remains its original cause and no fallback result is invented.
   * @evidence contracts/common.md#meaningful-documentation The generic result is delivered only to a still-authorized requester, while the operation may remain physically active after cancellation.
   * @evidence contracts/performance.md#efficient-algorithms Two fixed checks surround operation-specific work; no additional numerical build, polling loop or traversal is introduced.
   * @evidence contracts/performance.md#reuse-equivalent-work Each call runs its own effectful operation; equal callbacks/labels do not authorize sharing client-bound results.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The awaited operation retains its actual task resources until settlement, and the queue's running ownership remains until its enclosing task finishes.
   */
  run: <Result>(operation: () => Promise<Result>) => Promise<Result>;
}
