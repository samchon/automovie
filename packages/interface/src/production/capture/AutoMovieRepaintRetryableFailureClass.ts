/**
 * Failure classes that can legally consume another attempt.
 *
 * Cancellation, stale input, and exhausted budget are hard stops. Invalid
 * output remains an immutable rejected result and requires a reroll rather
 * than silently repeating the same request.
 *
 * @evidence requirements/repaint/retries-seeds-and-variation.md#repaint-retry-budget-stop Restricts authored retry grants to failure classes that the runtime can actually retry.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-attempt-selection Keeps the public policy vocabulary identical to the bounded executor state machine.
 */
export type AutoMovieRepaintRetryableFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "internal";
