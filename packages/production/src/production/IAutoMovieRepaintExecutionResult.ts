import { AutoMovieRepaintClaimRefusal } from "./AutoMovieRepaintClaimRefusal";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";

/**
 * Reports the immutable request ID, copied terminal attempts, optional accepted payload/attempt and closed stop reason with claim refusal only at claim-refused stops.
 *
 * @evidence contracts/common.md#principled-implementation Reports the immutable request ID, copied terminal attempts, optional accepted payload/attempt and closed stop reason with claim refusal only at claim-refused stops.
 * @evidence contracts/common.md#clear-and-simple-design The result separates terminal history, accepted generic value and stop/admission cause; scheduling and domain-specific media validation remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Returned attempt metadata scales with attempted dispatches; an accepted payload can retain raw bytes and pending external providers are not owned by this record.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; the result constructor clones durable metadata and retains the accepted payload reference; media validation belongs to the supplied execute callback.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned attempt metadata scales with attempted dispatches; an accepted payload can retain raw bytes and pending external providers are not owned by this record.
 */
export interface IAutoMovieRepaintExecutionResult<T> {
  /** Keeps one immutable request identity stable across admitted retry attempts. */
  requestId: string;

  /** Returns a cloned terminal metadata population in execution order, growing with admitted dispatches. */
  attempts: IAutoMovieRepaintAttemptRecord[];

  /** Carries the accepted caller-owned payload and terminal attempt, or null when no candidate was accepted. */
  accepted: {
    /** Transfers the callback's domain-validated payload without cloning its owned byte buffers. */
    value: T;

    /** Cites the admitted terminal attempt associated with the accepted payload. */
    attempt: IAutoMovieRepaintAttemptRecord;
  } | null;

  /** Reports the closed acceptance/refusal/budget/cancellation/unknown-outcome reason; it does not imply a provider has settled. */
  stop:
    | "accepted"
    | "cancelled"
    | "cost-exhausted"
    | "elapsed-exhausted"
    | "attempts-exhausted"
    | "backoff-failed"
    | "not-retryable"
    | "claim-refused"
    | "outcome-unknown"
    | "observer-failed";

  /**
   * The admission that stopped the request, present exactly when `stop` is
   * `claim-refused`; names the refused admission's cause and owning attempt
   * beside the stop reason.
   */
  claimRefusal: AutoMovieRepaintClaimRefusal | null;
}
