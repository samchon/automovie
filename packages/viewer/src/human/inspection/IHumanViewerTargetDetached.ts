/**
 * A session the browser session detached from, as `Target.detachedFromTarget` reports it.
 *
 * @evidence contracts/common.md#principled-implementation A detached CDP session is identified by its session ID with an optional target ID when the event supplies one.
 * @evidence contracts/common.md#clear-and-simple-design The event projection carries only fields needed to remove a known target session.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted target ID stays absent and is not guessed from an unrelated page or worker.
 * @evidence contracts/common.md#meaningful-documentation Names the detached session and optional associated target carried by the protocol event.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle A detached CDP session is identified by its session ID with an optional target ID when the event supplies one.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The event projection carries only fields needed to remove a known target session.
 * @author Samchon
 */
export interface IHumanViewerTargetDetached {
  /**
   * The detached session.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The detached session. A detached CDP session is identified by its session ID with an optional target ID when the event supplies one.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The detached session. The event projection carries only fields needed to remove a known target session.
   */
  sessionId: string;

  /**
   * The target it was attached to.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The target it was attached to. A detached CDP session is identified by its session ID with an optional target ID when the event supplies one.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The target it was attached to. The event projection carries only fields needed to remove a known target session.
   */
  targetId?: string;
}
