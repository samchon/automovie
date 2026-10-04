/**
 * The CDP `Inspector.detached` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the detach reason, which separates an exited renderer from a session taken away.
 * @evidence contracts/common.md#meaningful-documentation Names the one field the observer depends on.
 * @author Samchon
 */
export interface IHumanViewerInspectorDetached {
  /** Chromium's reason, `Render process gone.` when the renderer exited. */
  reason: string;
}
