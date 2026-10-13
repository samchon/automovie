/**
 * Failure classes that can legally consume another attempt.
 *
 * Cancellation, stale input, and exhausted budget are hard stops. Invalid
 * output remains an immutable rejected result and requires a reroll rather
 * than silently repeating the same request.
 */
export type AutoMovieRepaintRetryableFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "internal";
