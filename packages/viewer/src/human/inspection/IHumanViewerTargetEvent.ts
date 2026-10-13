/**
 * The part of a CDP `Target.targetCrashed` or `Target.targetDestroyed` event payload the renderer observer reads.
 *
 * @author Samchon
 */
export interface IHumanViewerTargetEvent {
  /** Target the event concerns. */
  targetId: string;
}
