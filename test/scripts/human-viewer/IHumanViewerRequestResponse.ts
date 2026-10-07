/**
 * The members of an HTTP response a queued GPU request uses to detect client
 * loss and to answer a refusal.
 *
 * @evidence contracts/common.md#principled-implementation Client loss is read from the response's own completion state.
 * @evidence contracts/common.md#meaningful-documentation Names each member the adapter depends on.
 * @author Samchon
 */
export interface IHumanViewerRequestResponse {
  /** Whether the socket was destroyed. */
  destroyed: boolean;

  /** Whether the response finished writing. */
  writableFinished: boolean;

  /** Status code to answer with. */
  statusCode: number;

  /** Subscribes to the response's close. */
  on: (event: "close", listener: () => void) => unknown;

  /** Unsubscribes from the response's close. */
  off: (event: "close", listener: () => void) => unknown;

  /** Sets a response header. */
  setHeader: (name: string, value: string) => unknown;

  /** Ends the response with a body. */
  end: (body: string) => unknown;
}
