/** Failure classes that an authored repaint retry policy may admit. */
export type AutoMovieRepaintFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "invalid-output"
  | "cancelled"
  | "input-stale"
  | "budget-exhausted"
  | "internal";
