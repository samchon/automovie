/**
 * Off-request work whose completion a reader can wait for.
 *
 * @evidence contracts/common.md#principled-implementation Busy state and completion are separate borrowed operations for off-request work; settling waits for physical completion.
 * @evidence contracts/common.md#clear-and-simple-design Two operations let request readers wait without taking ownership of the background task.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The port contains no elapsed-time cancellation or restart rule and cannot treat a wait as successful completion.
 * @evidence contracts/common.md#meaningful-documentation States how current work is observed and when the completion promise resolves.
 * @author Samchon
 */
export interface IHumanViewerSettleable {
  /**
   * Whether any of its work is still running.
   *
   * @evidence contracts/common.md#principled-implementation Busy reports whether the background owner's work is still physically running.
   * @evidence contracts/common.md#clear-and-simple-design The reader queries work state without retaining its own task lifecycle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Silence or elapsed time cannot be substituted for the owner's busy observation.
   * @evidence contracts/common.md#meaningful-documentation Names the current running-work query.
   */
  busy: () => boolean;

  /**
   * Resolve when the work running now has finished.
   *
   * @evidence contracts/common.md#principled-implementation Settlement resolves after the background work represented by the owner has finished.
   * @evidence contracts/common.md#clear-and-simple-design The owner retains completion ordering while readers await its promise.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Waiting does not race a timer or cancel work merely because the promise is slow.
   * @evidence contracts/common.md#meaningful-documentation Defines the completion promise for the work currently running.
   */
  settled: () => Promise<void>;
}
