/**
 * A request refused because its GPU waiting lane is full; the server answers
 * 503 with the queue owner's reason. The active request keeps its GPU slot.
 *
 * @evidence contracts/common.md#principled-implementation createHumanViewerQueue produces this subtype when the selected lane already has limit waiting entries; classifyHumanViewerRefusal maps that actual capacity rejection to HTTP 503 advice.
 * @evidence contracts/common.md#clear-and-simple-design Names queue admission failure independently of a task's later failure, leaving the active GPU callback and waiting-lane accounting with their scheduler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A full waiting lane refuses before task execution; the error does not drop the running request, imply physical cancellation or bypass the lane limit.
 * @evidence contracts/common.md#meaningful-documentation States the waiting-capacity cause, HTTP classification and preserved active slot; the inherited Error name is not used as a cross-realm classification contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inherited Error construction formats a refusal; queue length checks and bounded FIFO/cancellation work belong to createHumanViewerQueue.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A future request needs fresh capacity admission, even with an identical label; a prior queue-full result is not reusable task completion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the supplied reason and runtime stack while referenced, not a task or GPU slot; the scheduler bounds waiting entries and this class supplies no message-length cap.
 */
export class HumanViewerQueueFullError extends Error {}
