/**
 * Closed terminal failure classification recorded for repaint provider attempts and admission stops.
 *
 * @evidence contracts/common.md#principled-implementation Execution classifies transport/provider failure, invalid output, cancellation, stale input, exhausted budget and internal failure so immutable attempt records preserve the actual cause and retry decision.
 * @evidence contracts/common.md#clear-and-simple-design One closed vocabulary serves attempt diagnostics while the narrower retryable union separately expresses which failures may dispatch again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Not every listed failure is retryable; cancellation, stale input, invalid output and exhausted budget stop or require a new explicit request rather than being hidden by automatic repeat.
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
