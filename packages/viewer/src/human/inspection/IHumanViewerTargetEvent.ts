/**
 * The part of a CDP `Target.targetCrashed` or `Target.targetDestroyed` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation A target id projects the CDP crash/destroy payload needed to correlate terminal reports with the exact resident page.
 * @evidence contracts/common.md#clear-and-simple-design The event seam retains only the field read by renderer observation instead of duplicating the entire CDP protocol schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Target matching uses actual browser identity rather than treating an unrelated page's terminal event as the resident's failure.
 * @evidence contracts/common.md#meaningful-documentation The comment names the two CDP event kinds and documents the target identity field.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The target-event record chooses no event-dispatch or lifecycle-matching algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Crash/destroy reports are incoming effects; duplicate recovery suppression belongs to residency, not this payload.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The event owns no page or browser handle; observing code separately owns its CDP subscription lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerTargetEvent {
  /** Target the event concerns. */
  targetId: string;
}
