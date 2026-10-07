/**
 * A session the browser session detached from, as `Target.detachedFromTarget` reports it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerTargetDetached {
  /** The detached session. */
  sessionId: string;

  /** The target it was attached to. */
  targetId?: string;
}
