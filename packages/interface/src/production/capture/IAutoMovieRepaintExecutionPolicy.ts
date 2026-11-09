import { AutoMovieRepaintRetryableFailureClass } from "./AutoMovieRepaintRetryableFailureClass";

/**
 * Explicit attempt, elapsed-time, cancellation and metered-cost envelope for one immutable repaint request.
 *
 * @evidence contracts/development/design.md#principled-representation Numeric fields and a closed retry vocabulary describe the intended attempt, time and cost envelope. Safe-integer bounds, finite cost, backoff cardinality and remaining budgets are documented obligations, not checks performed by this erased type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One policy groups attempt, elapsed-time and cost limits with retry classes and backoff values, keeping the intended execution envelope explicit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The retry vocabulary omits cancellation, stale input and budget exhaustion. No current execution host implements charging, cancellation or deadline enforcement for this retained policy.
 * @evidence contracts/development/common.md#meaningful-documentation Defines attempts, millisecond deadlines and total ceiling, adapter cost units, backoff population and explicit retry classes.
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
