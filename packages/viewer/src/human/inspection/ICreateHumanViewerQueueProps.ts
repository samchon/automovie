/**
 * The queue's admission limits and its clock.
 *
 * @evidence contracts/common.md#principled-implementation Positive integer limit/patience and one millisecond clock configure bounded FIFO UI/CLI/bulk scheduling with optional foreground quiet gating.
 * @evidence contracts/common.md#clear-and-simple-design Keeps admission count, fairness and clock/delay bindings with the scheduler instead of exposing consumer-specific priorities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid limit/patience refuse before admission; running cancellation rejects the requester but preserves the GPU slot until actual settlement.
 * @evidence contracts/common.md#meaningful-documentation States per-lane waiting limits, consecutive UI-start patience and optional quiet milliseconds; quiet configuration/clock validity remains a caller premise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Configuration erases; picking visits three lanes, while FIFO shift/cancellation is linear in a lane bounded by limit.
 * @evidence contracts/performance.md#reuse-equivalent-work The scheduler shares one pending quiet wakeup; tasks are not merged by equal labels or caller identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three bounded waiting arrays plus one unsettled task remain; one timer may wait, and this scheduler has no independent shutdown/cancel-all seam.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerQueueProps {
  /** Requests allowed to wait in one lane before a new one is refused. */
  limit: number;

  /** Consecutive `ui` starts after which a waiting `cli` request goes next. */
  patience: number;

  /**
   * Monotonic clock in milliseconds.
   *
   * @evidence contracts/common.md#principled-implementation Supplies a monotonic millisecond clock for request duration, foreground quiet windows and running status.
   * @evidence contracts/common.md#clear-and-simple-design One clock keeps scheduling decisions and reported durations in the same frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Wall-clock changes cannot be compensated by arbitrary duration clamps; a monotonic finite clock is a caller premise the queue does not validate.
   * @evidence contracts/common.md#meaningful-documentation All timestamps and quietMs use milliseconds; the clock is sampled at arrival/start/settlement and status reads.
   * @evidence contracts/performance.md#efficient-algorithms Clock reads are constant-count per scheduling event; no model or waiting-array scan is performed by this signature.
   * @evidence contracts/performance.md#reuse-equivalent-work The same clock source is reused across requests, but current time is sampled anew because quiet eligibility changes while waiting.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains no timer or task; scheduling wakeup ownership remains with later/default setTimeout.
   */
  now: () => number;

  /**
   * Quiet period before a bulk request may start, in milliseconds; zero or absent means none.
   */
  quietMs?: number;

  /**
   * Runs a callback after a delay; defaults to `setTimeout`.
   *
   * @evidence contracts/common.md#principled-implementation Schedules the supplied quiet-window wakeup after the requested millisecond delay, defaulting to setTimeout when omitted.
   * @evidence contracts/common.md#clear-and-simple-design An optional delay binding isolates wakeup scheduling from lane selection and keeps only one pending quiet wakeup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must arrange deferred execution; its void result provides no cancellation handle or evidence the waiting bulk task has started.
   * @evidence contracts/common.md#meaningful-documentation run is the scheduler wakeup, ms is a positive requested delay, and omission uses the runtime timer without an added scheduler thread.
   * @evidence contracts/performance.md#efficient-algorithms One wakeup coalesces gated bulk requests; when it runs the queue revisits its three fixed lanes and current quiet eligibility.
   * @evidence contracts/performance.md#reuse-equivalent-work The timer flag shares one pending wakeup even if more bulk work arrives; task effects remain individually queued.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host timer retains run until firing; the signature has no clear handle and the queue exposes no teardown seam for that timer.
   */
  later?: (run: () => void, ms: number) => void;
}
