/**
 * The part of a CDP `Target.targetCrashed` or `Target.targetDestroyed` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Browser-root crash or destruction events identify the owned page by exact target ID.
 * @evidence contracts/common.md#clear-and-simple-design The observer's event projection contains only the correlation field it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target event cannot be attributed to the viewer through a guessed process-wide or global match.
 * @evidence contracts/common.md#meaningful-documentation Defines the target ID shared by the crash and destruction event projections.
 * @author Samchon
 */
export interface IHumanViewerTargetEvent {
  /** Target the event concerns. */
  targetId: string;
}
