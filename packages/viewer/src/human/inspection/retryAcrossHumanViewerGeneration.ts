import type { IRetryAcrossHumanViewerGenerationProps } from "./IRetryAcrossHumanViewerGenerationProps.js";
import { isHumanViewerGenerationChange } from "./isHumanViewerGenerationChange.js";

/**
 * Rerun a caller-supplied operation after an error message matches the existing generation-change classification, awaiting the supplied settlement between attempts. The capture route supplies replayable work and a total budget of four; this generic helper does not prove idempotence or undo prior build, display, telemetry or disk effects. A finite positive integer attempt budget is a caller premise, not runtime admission here. A nonmatching failure or exhausted budget propagates the original error.
 *
 * @evidence contracts/common.md#principled-implementation Retries only errors matched by the existing generation-message classifier and awaits supplied settlement before each repeat; replay safety and a finite positive integer budget remain caller premises, with the actual capture route supplying four.
 * @evidence contracts/common.md#clear-and-simple-design The operation and settlement callbacks retain their owners; this helper only sequences the bounded generation retry protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonmatching failures propagate unchanged and repeats do not certify current-source success or reverse prior effects; message matching is not independent proof of error provenance, and malformed budgets are not repaired.
 * @evidence contracts/common.md#meaningful-documentation Documentation names message-classified retry, settlement order, caller replay/budget premises and exhaustion behavior.
 * @evidence contracts/performance.md#efficient-algorithms With caller-supplied valid budget A it awaits at most A operations and intervening settlements, retaining one result/failure at a time; actual render costs remain with the operation, while NaN or infinite budgets provide no finite attempt bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Retried operations run anew after supplied settlement; an earlier effectful capture is not reused under a matching label and this coordinator does not independently observe generation change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper awaits each attempted operation and settle callback, keeps no background retry timer and acquires no worker or page handle.
 */
export async function retryAcrossHumanViewerGeneration<T>(
  run: () => Promise<T>,
  props: IRetryAcrossHumanViewerGenerationProps,
): Promise<T> {
  for (let attempt: number = 1; ; ++attempt) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= props.attempts || !isHumanViewerGenerationChange(error))
        throw error;
      await props.settle();
    }
  }
}
