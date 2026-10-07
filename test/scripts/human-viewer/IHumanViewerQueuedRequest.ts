/**
 * What a queued GPU task gets to stay bound to its HTTP client.
 *
 * @evidence contracts/common.md#principled-implementation Every guarded operation is awaited to settlement before a lost client's result is discarded.
 * @evidence contracts/common.md#meaningful-documentation Names the cancellation signal and the two guards.
 * @author Samchon
 */
export interface IHumanViewerQueuedRequest {
  /** Aborted when the client disconnects before the response finished. */
  signal: AbortSignal;

  /** Throws when the client is gone. */
  check: () => void;

  /** Runs one page operation to settlement, checking the client before and after. */
  run: <Result>(operation: () => Promise<Result>) => Promise<Result>;
}
