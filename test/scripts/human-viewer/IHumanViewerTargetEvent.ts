/**
 * The part of a CDP `Target.targetCrashed` or `Target.targetDestroyed` event
 * payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Correlates a browser-root event with the owned page by exact target id.
 * @evidence contracts/common.md#meaningful-documentation Names the one field the observer depends on.
 * @author Samchon
 */
export interface IHumanViewerTargetEvent {
  /** Target the event concerns. */
  targetId: string;
}
