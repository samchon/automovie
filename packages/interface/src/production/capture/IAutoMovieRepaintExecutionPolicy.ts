import { AutoMovieRepaintRetryableFailureClass } from "./AutoMovieRepaintRetryableFailureClass";

/**
 * Complete bounded execution policy for one immutable repaint request.
 *
 * @evidence requirements/repaint/retries-seeds-and-variation.md#repaint-retry-budget-stop Makes attempts, timeout, elapsed time, cost, retryability, and deterministic backoff authored inputs rather than hidden host behavior.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-attempt-selection Types the bounded request policy consumed before an external call.
 */
export interface IAutoMovieRepaintExecutionPolicy {
  /** Maximum provider calls belonging to one request. */
  maximumAttempts: number;

  /** Per-attempt cancellation deadline in milliseconds. */
  attemptTimeoutMs: number;

  /** Whole-request wall-time ceiling in milliseconds. */
  maximumElapsedMs: number;

  /** Maximum metered cost in the adapter's declared cost unit. */
  maximumCostUnits: number;

  /** One deterministic delay for every possible retry. */
  backoffMs: number[];

  /** Exact failure classes allowed to consume another attempt. */
  retryableFailures: AutoMovieRepaintRetryableFailureClass[];
}
