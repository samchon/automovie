/**
 * A session the browser session detached from, as `Target.detachedFromTarget` reports it.
 *
 * @evidence contracts/common.md#principled-implementation A detached CDP session is identified by its session ID with an optional target ID when the event supplies one.
 * @evidence contracts/common.md#clear-and-simple-design The event projection carries only fields needed to remove a known target session.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted target ID stays absent and is not guessed from an unrelated page or worker.
 * @evidence contracts/common.md#meaningful-documentation Names the detached session and optional associated target carried by the protocol event.
 * @author Samchon
 */
export interface IHumanViewerTargetDetached {
  /** The detached session. */
  sessionId: string;

  /** The target it was attached to. */
  targetId?: string;
}
