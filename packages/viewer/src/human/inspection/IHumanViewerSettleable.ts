/**
 * Off-request work whose completion a reader can wait for.
 *
 * @evidence contracts/common.md#principled-implementation A busy query and awaited completion expose background work without forcing readers to initiate another copy of that work.
 * @evidence contracts/common.md#clear-and-simple-design Two lifecycle operations provide the readiness information catalogue and generation readers need without exposing job internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Settlement represents the underlying owner's actual tasks, not a timeout that declares unfinished background reads successful.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish the current running-work query from waiting for its completion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The settleable interface selects no polling or task-joining algorithm; each background owner implements its operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The lifecycle seam defines waiting rather than memo-result equivalence; sidecar stamps and owners govern any underlying reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The background owner retains running tasks and settles them; this borrowed seam permits waiting without transferring cancellation or disposal ownership.
 *
 * @author Samchon
 */
export interface IHumanViewerSettleable {
  /**
   * Whether any of its work is still running.
   *
   * @evidence contracts/common.md#principled-implementation The query reports whether the background owner has outstanding work instead of inferring completion from elapsed time.
   * @evidence contracts/common.md#clear-and-simple-design A synchronous boolean exposes progress without leaking the owner's task collection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Busy status is not converted into readiness for a selected request or expected fixture.
   * @evidence contracts/common.md#meaningful-documentation The member states that any still-running owned work makes the query true.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This query contract prescribes no implementation of outstanding-task accounting.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Running-work status changes with task settlement and is not a reusable computed resource.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The boolean query borrows task state without acquiring or releasing any task itself.
   */
  busy: () => boolean;

  /**
   * Resolve when the work running now has finished.
   *
   * @evidence contracts/common.md#principled-implementation Awaiting the owner's completion promise observes actual background settlement rather than racing it against a success timeout.
   * @evidence contracts/common.md#clear-and-simple-design The wait capability hides background job details while giving catalogue readers one completion boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This completion seam does not cancel work silently or manufacture settled state to unblock admission.
   * @evidence contracts/common.md#meaningful-documentation The prose specifies waiting for currently running work to finish.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The settlement signature does not dictate Promise joining or repeated-work polling strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Waiting observes existing work rather than duplicating it; result equivalence remains the background owner's policy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The background owner retains its work until completion and removes settled tasks; this callback only lends the wait boundary.
   */
  settled: () => Promise<void>;
}
