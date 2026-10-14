/**
 * A session the browser session detached from, as `Target.detachedFromTarget` reports it.
 *
 * @evidence contracts/common.md#principled-implementation The CDP detach event is represented by required session identity and optional target identity, matching which correlation fields may be supplied.
 * @evidence contracts/common.md#clear-and-simple-design Only the detached session and target are exposed; renderer-stop interpretation remains with the lifecycle observer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This payload does not reinterpret all session detachments as renderer death or manufacture a missing target id.
 * @evidence contracts/common.md#meaningful-documentation The prose names Target.detachedFromTarget and distinguishes required session from optional target.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The detach payload type implements no target matching or protocol parsing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A detach event is a lifecycle fact with no deduplicated result cache in this declaration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Session ids are descriptive strings rather than owned CDP sessions; observers retain and dispose actual session handles.
 *
 * @author Samchon
 */
export interface IHumanViewerTargetDetached {
  /** The detached session. */
  sessionId: string;

  /** The target it was attached to. */
  targetId?: string;
}
