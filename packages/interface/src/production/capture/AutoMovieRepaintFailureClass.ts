/**
 * Closed terminal failure classification recorded for repaint provider attempts and admission stops.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union represents transport/provider failure, invalid output, cancellation, stale input, exhausted budget and internal failure; the erased type classifies no actual attempt.
 * @evidence contracts/common.md#clear-and-simple-design One closed vocabulary serves attempt diagnostics while the narrower retryable union separately expresses which failures may dispatch again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The separate retryable vocabulary omits cancellation, stale input, invalid output and exhausted budget; no retained execution host enforces stop or reroll behavior.
 * @evidence contracts/common.md#meaningful-documentation Defines terminal failure purpose and separates classification from retry authorization.
 * @author Samchon
 */
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
