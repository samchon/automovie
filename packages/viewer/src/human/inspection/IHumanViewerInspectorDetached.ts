/**
 * The CDP `Inspector.detached` event payload the renderer observer reads.
 *
 * @author Samchon
 */
export interface IHumanViewerInspectorDetached {
  /** Chromium's reason, `Render process gone.` when the renderer exited. */
  reason: string;
}
