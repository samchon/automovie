/**
 * Failure classes that can legally consume another attempt.
 *
 * Cancellation, stale input and exhausted budget stop the request; invalid output remains rejected and requires an explicit reroll.
 *
 * @evidence contracts/common.md#principled-implementation The retry vocabulary contains only transport, timeout, rate, provider-refusal and internal classes that a bounded policy can explicitly admit, subject to remaining attempt, elapsed and cost budgets.
 * @evidence contracts/common.md#clear-and-simple-design A narrowed union separates potential retry classes from the broader immutable terminal failure vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Listing a class does not automatically retry it; policy membership and live request identity are required, while invalid output, cancellation and stale input cannot be hidden by repeated dispatch.
 * @evidence contracts/common.md#meaningful-documentation Defines retry eligibility, hard stops and the explicit-reroll requirement for rejected generated output.
 * @author Samchon
 */
export type AutoMovieRepaintRetryableFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "internal";
