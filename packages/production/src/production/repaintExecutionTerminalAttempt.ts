import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { repaintExecutionValidInstant } from "./repaintExecutionValidInstant";

/**
 * Clones and validates start/completion Dates, then produces version-one ISO terminal metadata in the original spread/override order.
 *
 * @evidence contracts/common.md#principled-implementation Clones and validates start/completion Dates, then produces version-one ISO terminal metadata in the original spread/override order.
 * @evidence contracts/common.md#clear-and-simple-design One terminal constructor owns Date cloning/version/ISO conversion; outcome classification and durable project admission remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The returned record owns metadata only; raw buffers and provider tasks remain outside this constructor.
 * @evidence contracts/performance.md#efficient-algorithms Date conversion is constant work beyond the input metadata spread; invalid instants throw before an immutable terminal record is accepted.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record owns metadata only; raw buffers and provider tasks remain outside this constructor.
 */
export const repaintExecutionTerminalAttempt: (input: Omit<IAutoMovieRepaintAttemptRecord, "version" | "startedAt" | "completedAt"> & { startedAt: Date; completedAt: Date; }) => IAutoMovieRepaintAttemptRecord = (
  input: Omit<
    IAutoMovieRepaintAttemptRecord,
    "version" | "startedAt" | "completedAt"
  > & {
    startedAt: Date;
    completedAt: Date;
  },
): IAutoMovieRepaintAttemptRecord => {
  const startedAt: Date = repaintExecutionValidInstant(input.startedAt, "attempt start");
  const completedAt: Date = repaintExecutionValidInstant(input.completedAt, "attempt completion");
  return {
    version: 1,
    ...input,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
  };
};
