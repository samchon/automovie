/**
 * The CDP `Inspector.detached` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the detach reason, which separates an exited renderer from a session taken away.
 * @evidence contracts/common.md#meaningful-documentation Names the one field the observer depends on.
 *
 * @evidence contracts/common.md#clear-and-simple-design Only Chromium's detach reason is projected because the observer owns session correlation separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Renderer exit is distinguished from a session being taken away using the received CDP reason.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Keeps the detach reason, which separates an exited renderer from a session taken away.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Renderer exit is distinguished from a session being taken away using the received CDP reason.
 *
 * @author Samchon
 */
export interface IHumanViewerInspectorDetached {
  /**
   * Chromium's reason, `Render process gone.` when the renderer exited.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves Chromium's exact detach cause so observer-session loss is not mistaken for physical renderer exit.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves Chromium's exact detach cause so observer-session loss is not mistaken for physical renderer exit.
   */
  reason: string;
}
