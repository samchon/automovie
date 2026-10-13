/**
 * The queue's admission limits and its clock.
 *
 * @evidence contracts/common.md#clear-and-simple-design Limits and time sources are explicit inputs, so the policy has no hidden state.
 * @evidence contracts/common.md#meaningful-documentation Names each limit and its unit.
 *
 * @evidence contracts/common.md#principled-implementation A monotonic clock and explicit queue limits make admission and fairness decisions depend on supplied scheduling facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Patience, waiting capacity and quiet duration govern queue roles, without document-specific scheduling exceptions.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness A monotonic clock and explicit queue limits make admission and fairness decisions depend on supplied scheduling facts.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Patience, waiting capacity and quiet duration govern queue roles, without document-specific scheduling exceptions.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerQueueProps {
  /**
   * Requests allowed to wait in one lane before a new one is refused.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness Bounds accepted waiting requests in each lane before the queue returns an explicit refusal.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Bounds accepted waiting requests in each lane before the queue returns an explicit refusal.
   */
  limit: number;

  /**
   * Consecutive `ui` starts after which a waiting `cli` request goes next.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness Limits consecutive interactive starts so a waiting command request receives the declared fairness turn.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Limits consecutive interactive starts so a waiting command request receives the declared fairness turn.
   */
  patience: number;

  /**
   * Monotonic clock in milliseconds.
   *
   * @evidence contracts/common.md#principled-implementation A monotonic millisecond clock supplies queue waiting, fairness and running-duration measurements.
   * @evidence contracts/common.md#clear-and-simple-design The queue receives one clock instead of mixing wall-clock and elapsed readings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Time controls quiet admission only and cannot terminate a running task by age.
   * @evidence contracts/common.md#meaningful-documentation The returned number is a monotonic millisecond reading.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness A monotonic millisecond clock supplies queue waiting, fairness and running-duration measurements.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness The returned number is a monotonic millisecond reading.
   */
  now: () => number;

  /**
   * Quiet period before a bulk request may start, in milliseconds; zero or absent means none.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness Defers only waiting background work for the supplied millisecond quiet interval; it does not terminate running work.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Defers only waiting background work for the supplied millisecond quiet interval; it does not terminate running work.
   */
  quietMs?: number;

  /**
   * Runs a callback after a delay; defaults to `setTimeout`.
   *
   * @evidence contracts/common.md#principled-implementation The scheduler requests a later quiet-period reconsideration through the supplied delay operation.
   * @evidence contracts/common.md#clear-and-simple-design Only waiting bulk admission is scheduled; running work stays with the GPU slot owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback is a supported scheduling input rather than replacement of a global timer.
   * @evidence contracts/common.md#meaningful-documentation Delay is milliseconds and omission selects the normal setTimeout scheduler.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness The scheduler requests a later quiet-period reconsideration through the supplied delay operation.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Delay is milliseconds and omission selects the normal setTimeout scheduler.
   */
  later?: (run: () => void, ms: number) => void;
}
