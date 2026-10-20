/**
 * Failure classes that can legally consume another attempt.
 *
 * Cancellation, stale input and exhausted budget stop the request; invalid output remains rejected and requires an explicit reroll.
 *
 * @evidence contracts/common.md#principled-implementation The closed retry vocabulary contains transport, timeout, rate-limit, provider-refusal and internal classes for an authored policy; it performs no budget or eligibility check.
 * @evidence contracts/common.md#clear-and-simple-design A narrowed union separates potential retry classes from the broader immutable terminal failure vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Listing a class does not execute a retry; the retained type has no execution host enforcing policy membership, request identity or hard stops.
 * @evidence contracts/common.md#meaningful-documentation Defines retry eligibility, hard stops and the explicit-reroll requirement for rejected generated output.
 */
export type AutoMovieRepaintRetryableFailureClass =
  | "timeout"
  | "rate-limit"
  | "transport"
  | "provider-refusal"
  | "internal";
