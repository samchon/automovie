/**
 * What a queued GPU task gets to stay bound to its HTTP client.
 *
 * @evidence contracts/common.md#principled-implementation Every guarded operation is awaited to settlement before a lost client's result is discarded.
 * @evidence contracts/common.md#meaningful-documentation Names the cancellation signal and the two guards.
 *
 * @evidence contracts/common.md#clear-and-simple-design An AbortSignal and two guards bind all queued operations to the same response lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Client loss withdraws result authority after dispatched operations settle rather than starting replacement work concurrently.
 *
 * @author Samchon
 */
export interface IHumanViewerQueuedRequest {
  /** Aborted when the client disconnects before the response finished. */
  signal: AbortSignal;

  /**
   * Throws when the client is gone.
   *
   * @evidence contracts/common.md#principled-implementation Client disconnection is checked through the request's actual abort signal.
   * @evidence contracts/common.md#clear-and-simple-design One guard exposes the response lifetime without replacing queue ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The guard uses explicit client-loss state rather than an elapsed request deadline.
   * @evidence contracts/common.md#meaningful-documentation The call throws when the bound HTTP client is gone.
   */
  check: () => void;

  /**
   * Runs one page operation to settlement, checking the client before and after.
   *
   * @evidence contracts/common.md#principled-implementation A dispatched page operation is awaited to physical promise settlement with client checks around it.
   * @evidence contracts/common.md#clear-and-simple-design One guard keeps operation execution and result-authority checks together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Losing a client cannot free the GPU slot while its operation still runs.
   * @evidence contracts/common.md#meaningful-documentation The generic promise returns the operation result only while the client remains authorized.
   */
  run: <Result>(operation: () => Promise<Result>) => Promise<Result>;
}
