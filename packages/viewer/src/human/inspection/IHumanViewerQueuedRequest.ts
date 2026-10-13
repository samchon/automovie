/**
 * What a queued GPU task gets to stay bound to its HTTP client.
 *
 * @author Samchon
 */
export interface IHumanViewerQueuedRequest {
  /** Aborted when the client disconnects before the response finished. */
  signal: AbortSignal;

  /** Throws when the client is gone. */
  check: () => void;

  /**
   * Runs one page operation to settlement, checking the client before and after.
   */
  run: <Result>(operation: () => Promise<Result>) => Promise<Result>;
}
