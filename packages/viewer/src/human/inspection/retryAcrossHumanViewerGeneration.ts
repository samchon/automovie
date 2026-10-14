import type { IRetryAcrossHumanViewerGenerationProps } from "./IRetryAcrossHumanViewerGenerationProps.js";
import { isHumanViewerGenerationChange } from "./isHumanViewerGenerationChange.js";

/**
 * Run a capture again on the generation that replaced the one it started on. A request that arrives while the source rebuilds, or straddles the moment a new generation is published, fails only because two generations met; the capture is idempotent and writes its response after it succeeds, so running it again on the settled generation answers the same question. `settle` waits until a generation can draw again, and the attempts are bounded so a source that keeps changing still ends in the last refusal. Any other error is returned at once, unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Retries the requested operation only for the existing source-generation interruption classification, settling the next generation between attempts up to the caller's explicit limit.
 * @evidence contracts/common.md#clear-and-simple-design The operation and settlement callbacks retain their owners; this helper only sequences the bounded generation retry protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated failures propagate unchanged and the attempt limit does not convert an interrupted frame into a successful current-source result.
 * @evidence contracts/common.md#meaningful-documentation Documentation names generation-only retry, settlement order and exhaustion behavior.
 * @evidence contracts/performance.md#efficient-algorithms For A admitted attempts it awaits at most A operations and their intervening settlements, retaining one result/failure at a time; actual render costs remain with the operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Retried operations run anew after changed generation authority; an earlier effectful capture is not reused under a matching label.
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
