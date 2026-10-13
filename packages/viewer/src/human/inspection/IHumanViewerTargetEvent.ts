/**
 * The part of a CDP `Target.targetCrashed` or `Target.targetDestroyed` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Browser-root crash or destruction events identify the owned page by exact target ID.
 * @evidence contracts/common.md#clear-and-simple-design The observer's event projection contains only the correlation field it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target event cannot be attributed to the viewer through a guessed process-wide or global match.
 * @evidence contracts/common.md#meaningful-documentation Defines the target ID shared by the crash and destruction event projections.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Browser-root crash or destruction events identify the owned page by exact target ID.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The observer's event projection contains only the correlation field it reads.
 * @author Samchon
 */
export interface IHumanViewerTargetEvent {
  /**
   * Target the event concerns.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Target the event concerns. Browser-root crash or destruction events identify the owned page by exact target ID.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Target the event concerns. The observer's event projection contains only the correlation field it reads.
   */
  targetId: string;
}
