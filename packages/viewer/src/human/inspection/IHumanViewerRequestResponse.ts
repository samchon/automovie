/**
 * The members of an HTTP response a queued GPU request uses to detect client loss and to answer a refusal.
 *
 * @evidence contracts/common.md#principled-implementation The structural HTTP response seam exposes transport completion and close events so queued GPU work distinguishes disconnects from successful response completion.
 * @evidence contracts/common.md#clear-and-simple-design Only lifecycle observation and refusal writing are exposed; queue scheduling and physical renderer settlement stay outside the response contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is the real response's close/completion protocol, with no patched transport behavior or synthetic success on client loss.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify destroyed sockets, completed writes, close subscription symmetry and the refusal header/body operations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The response signature does not choose queue algorithms, response serialization or socket buffering strategies.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sending headers and bodies changes one response; this contract does not claim equivalent effects can be shared between clients.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The HTTP server owns the response; queueHumanViewerRequest attaches one close listener and removes it after request settlement.
 *
 * @author Samchon
 */
export interface IHumanViewerRequestResponse {
  /** Whether the socket was destroyed. */
  destroyed: boolean;

  /** Whether the response finished writing. */
  writableFinished: boolean;

  /** Status code to answer with. */
  statusCode: number;

  /**
   * Subscribes to the response's close.
   *
   * @evidence contracts/common.md#principled-implementation Response-close subscription observes client loss on the response rather than the request-body completion event.
   * @evidence contracts/common.md#clear-and-simple-design The narrow event union exposes only the close notification the queued request adapter consumes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The real transport emits close; no monkey-patched event or fixture-only disconnect mechanism is declared.
   * @evidence contracts/common.md#meaningful-documentation Its comment identifies response close subscription; the enclosing type separates finished writes from destruction.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The listener-registration signature chooses no event-emitter storage strategy or socket polling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each queued response needs its own listener because client-loss effects depend on that response's completion state.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The queued adapter owns its close listener and must remove that same function after settlement using off.
   */
  on: (event: "close", listener: () => void) => unknown;

  /**
   * Unsubscribes from the response's close.
   *
   * @evidence contracts/common.md#principled-implementation Removing the exact response-close listener ends disconnect observation once the corresponding queued request settles.
   * @evidence contracts/common.md#clear-and-simple-design Unsubscription mirrors the same closed event name and listener type used for registration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup uses the response's own event API without replacing emitter internals or dropping unrelated listeners.
   * @evidence contracts/common.md#meaningful-documentation The member states that response-close subscription is removed by this operation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The unsubscription signature leaves listener lookup and removal implementation to the HTTP response emitter.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Listener removal has an owner-specific effect and cannot be represented by another response's completed cleanup.
   * @evidence contracts/performance.md#bound-retention-and-release-resources This operation relinquishes the adapter-owned callback reference while leaving the server-owned response alive.
   */
  off: (event: "close", listener: () => void) => unknown;

  /**
   * Sets a response header.
   *
   * @evidence contracts/common.md#principled-implementation The response header operation carries refusal content type and optional Retry-After through the HTTP server's native interface.
   * @evidence contracts/common.md#clear-and-simple-design String header names and values cover the queue adapter's response metadata without exposing broader socket operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Header values come from refusal classification rather than consumer-specific expected HTTP answers.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies header assignment; native response errors and header-write timing remain transport semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This assignment signature does not choose HTTP header encoding or buffering algorithms.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Headers belong to one HTTP response and cannot be reused as completed effects on another client's response.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Header assignment transfers no disposable handle; the response owns its outgoing header storage.
   */
  setHeader: (name: string, value: string) => unknown;

  /**
   * Ends the response with a body.
   *
   * @evidence contracts/common.md#principled-implementation Ending the response publishes its serialized refusal body through the transport's normal completion operation.
   * @evidence contracts/common.md#clear-and-simple-design One string body suffices for the queued adapter's JSON refusal without taking ownership of general streaming responses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The actual failure description is written; this contract does not manufacture successful capture content after an error.
   * @evidence contracts/common.md#meaningful-documentation Its documentation states that the response ends with the supplied body; transport completion remains externally observable.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The end signature does not choose serialization, network chunking or flush implementation strategies.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Completing a client's response is an individual side effect, even when another refusal has identical text.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The HTTP transport owns final write completion; queue cleanup removes its listener independently after the task settles.
   */
  end: (body: string) => unknown;
}
