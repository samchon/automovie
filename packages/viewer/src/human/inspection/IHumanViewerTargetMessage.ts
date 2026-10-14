/**
 * A message a worker target sent back through the browser session.
 *
 * @evidence contracts/common.md#principled-implementation Worker protocol traffic carries the attached session id separately from its JSON message text for session-scoped correlation.
 * @evidence contracts/common.md#clear-and-simple-design The two-field transport projection lets the worker-heap reader decode protocol messages without coupling the type to every CDP response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Messages preserve actual browser-session text rather than supplying synthetic heap readings for selected worker targets.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes the carrying session from the protocol message serialized as JSON text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The worker-message shape chooses no JSON parser or request-response lookup algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Protocol replies must match their live session/request; this text container declares no shared response cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only ids and serialized text cross the event boundary; the heap observer owns session attachment and listener cleanup.
 *
 * @author Samchon
 */
export interface IHumanViewerTargetMessage {
  /** The session that carried it. */
  sessionId: string;

  /** The protocol message as JSON text. */
  message: string;
}
