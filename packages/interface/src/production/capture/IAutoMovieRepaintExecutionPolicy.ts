import { AutoMovieRepaintRetryableFailureClass } from "./AutoMovieRepaintRetryableFailureClass";

/**
 * Explicit attempt, elapsed-time, cancellation and metered-cost envelope for one immutable repaint request.
 *
 * @evidence contracts/common.md#principled-implementation Execution admits positive safe-integer attempt and host-safe timer bounds, non-negative finite cost and exactly one deterministic backoff per possible retry, checking remaining budgets and immutable request identity before dispatch.
 * @evidence contracts/common.md#clear-and-simple-design One policy groups every execution limit with its admitted retry classes so retries cannot borrow unstated host defaults or silently change the request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation, stale input and budget exhaustion cannot retry; provider work is charged even when it fails, and timers signal cancellation rather than guaranteeing a noncooperative adapter has stopped executing.
 * @evidence contracts/common.md#meaningful-documentation Defines attempts, millisecond deadlines and total ceiling, adapter cost units, backoff population and explicit retry classes.
 * @author Samchon
 */
export interface IAutoMovieRepaintExecutionPolicy {
  /** Positive safe-integer maximum provider calls belonging to one request. */
  maximumAttempts: number;

  /** Per-attempt cancellation deadline in milliseconds. */
  attemptTimeoutMs: number;

  /** Whole-request wall-time ceiling in milliseconds. */
  maximumElapsedMs: number;

  /** Maximum metered cost in the adapter's declared cost unit. */
  maximumCostUnits: number;

  /** Exactly maximumAttempts minus one non-negative host-safe millisecond delays, one per possible retry. */
  backoffMs: number[];

  /** Exact failure classes allowed to consume another attempt. */
  retryableFailures: AutoMovieRepaintRetryableFailureClass[];
}
