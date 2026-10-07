/**
 * A capture stage made no progress within its bound. The request ends with
 * this named error and its queue slot is released; a page stage that stalls
 * also has the page replaced, since a page that stopped progressing cannot
 * be trusted with the next capture.
 *
 * @evidence contracts/common.md#principled-implementation A stalled stage ends its request by name instead of holding the shared queue.
 * @evidence contracts/common.md#meaningful-documentation States what the error means and what follows it.
 * @author Samchon
 */
export class HumanViewerStalledError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "HumanViewerStalledError";
  }
}
