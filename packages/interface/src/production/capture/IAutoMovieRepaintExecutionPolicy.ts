import type { AutoMovieRepaintRetryableFailureClass } from "./AutoMovieRepaintRetryableFailureClass";

/**
 * Explicit attempt, elapsed-time, cancellation and metered-cost envelope for
 * one immutable repaint request.
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

  /**
   * Exactly maximumAttempts minus one non-negative host-safe millisecond
   * delays, one per possible retry.
   */
  backoffMs: number[];

  /** Exact failure classes allowed to consume another attempt. */
  retryableFailures: AutoMovieRepaintRetryableFailureClass[];
}
