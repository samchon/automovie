import type { IProductionRenderChunkFailure } from "./IProductionRenderChunkFailure";
import { ProductionRenderChunkLifecycleError } from "./ProductionRenderChunkLifecycleError";

/**
 * Preserve one reserved fatal chunk's attempt, failure-record and release errors in phase order.
 *
 * @evidence contracts/common.md#principled-implementation Filters present failure envelopes in attempt/record/release order; a singleton returns its original thrown value, otherwise the named AggregateError retains the ordered causes. Caller reserves this path only after fatal record/release failure.
 * @evidence contracts/common.md#clear-and-simple-design The scheduler owns first-fatal selection; this helper owns that selected chunk's complete phase chain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-Error thrown values remain causes rather than string replacements; failures from other workers after the first fatal reservation are not collected by this helper.
 * @evidence contracts/common.md#meaningful-documentation States singleton identity, ordered aggregate construction and the scheduler's first-fatal limitation.
 * @evidence contracts/performance.md#efficient-algorithms At most three envelope checks and cause references plus native Error stack/message construction; no render/frame population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Already captured envelopes are consumed without repeating host actions or retrying failed cleanup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the returned cause/aggregate until release; arbitrary causes can retain their own unbounded graphs, while this helper acquires no handle or task.
 */
export function productionRenderChunkLifecycleFailure(attempt: IProductionRenderChunkFailure | undefined, failureRecord: IProductionRenderChunkFailure | undefined, release: IProductionRenderChunkFailure | undefined): unknown {
    const failures: IProductionRenderChunkFailure[] = [attempt, failureRecord, release].filter((failure: IProductionRenderChunkFailure | undefined): failure is IProductionRenderChunkFailure => failure !== undefined);
    if (failures.length === 1)
        return failures[0]!.error;
    return new ProductionRenderChunkLifecycleError(failures.map((failure: IProductionRenderChunkFailure): unknown => failure.error), "Production render chunk cleanup failed after the render attempt failed.");
}
