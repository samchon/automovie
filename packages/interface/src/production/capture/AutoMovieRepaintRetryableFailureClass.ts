/**
 * Failure classes that can legally consume another attempt.
 *
 * Cancellation, stale input and exhausted budget stop the request; invalid
 * output remains rejected and requires an explicit reroll.
 */
export type AutoMovieRepaintRetryableFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "internal";
