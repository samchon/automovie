import { AutoMovieRepaintClaimRefusal } from "./AutoMovieRepaintClaimRefusal";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { IAutoMovieRepaintExecutionResult } from "./IAutoMovieRepaintExecutionResult";

/**
 * Copies terminal attempts and any claim refusal into the closed result while retaining the accepted payload reference and its immutable terminal attempt.
 *
 * @evidence contracts/common.md#principled-implementation Copies terminal attempts and any claim refusal into the closed result while retaining the accepted payload reference and its immutable terminal attempt.
 * @evidence contracts/common.md#clear-and-simple-design One result constructor owns the history/refusal copy boundary; execution retains its mutable work array and the accepted payload keeps caller ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The copied array and accepted payload transfer to the caller; no mutable execution array is cached across requests.
 * @evidence contracts/performance.md#efficient-algorithms structuredClone cost scales with terminal metadata; no provider bytes are cloned through the accepted value.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The copied array and accepted payload transfer to the caller; no mutable execution array is cached across requests.
 */
export const repaintExecutionResult: <T>(requestId: string, attempts: IAutoMovieRepaintAttemptRecord[], accepted: IAutoMovieRepaintExecutionResult<T>["accepted"], stop: IAutoMovieRepaintExecutionResult<T>["stop"], claimRefusal?: AutoMovieRepaintClaimRefusal | null) => IAutoMovieRepaintExecutionResult<T> = <T>(
  requestId: string,
  attempts: IAutoMovieRepaintAttemptRecord[],
  accepted: IAutoMovieRepaintExecutionResult<T>["accepted"],
  stop: IAutoMovieRepaintExecutionResult<T>["stop"],
  claimRefusal: AutoMovieRepaintClaimRefusal | null = null,
): IAutoMovieRepaintExecutionResult<T> => ({
  requestId,
  attempts: structuredClone(attempts),
  accepted,
  stop,
  claimRefusal: claimRefusal === null ? null : structuredClone(claimRefusal),
});
