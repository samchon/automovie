import { type IAutoMovieProductionRenderChunk, type IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { IAutoMovieProductionRenderChunkReceipt } from "./IAutoMovieProductionRenderChunkReceipt";
import type { IAutoMovieProductionRenderAttempt } from "./IAutoMovieProductionRenderAttempt";
import type { IAutoMovieProductionRenderChunkStatus } from "./IAutoMovieProductionRenderChunkStatus";
import { verifyProductionRenderChunkReceipt } from "./verifyProductionRenderChunkReceipt";
import { productionRenderJobChunkStatus } from "./productionRenderJobChunkStatus";

/**
 * Classify each planned slot against supplied completion and attempt records.
 *
 * @evidence contracts/common.md#principled-implementation For each current chunk selects an exact-id receipt/attempt before the last same-slot record; receipt facts are checked before complete, otherwise attempt/stale/planned rules apply. Inputs are typed records, not newly acquired bytes.
 * @evidence contracts/common.md#clear-and-simple-design One ordered projection separates status advice from execution/storage; its receipt-verification consumer is the existing semantic-mask owning unit, with no live app invocation identified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching slot alone is stale rather than complete; byte-fact syntax is not resident media verification, and receipt-check catch assumes its own Error refusals.
 * @evidence contracts/common.md#meaningful-documentation Documents current-id preference, historical last-record fallback and preserved plan order/correction strings.
 * @evidence contracts/performance.md#efficient-algorithms For C chunks, R receipts and A attempts, repeated filters cost O(C(R+A)) plus each receipt's frame/layer checks; copied slot arrays and C result rows contribute to storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each selected record is reused for its chunk's decision; no global index or retained status cache is introduced in this preserving split.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result rows transfer to callers and per-slot arrays expire; no lock, byte payload, handle or task is retained.
 */
export function productionRenderChunkStatuses(props: {
    /** Current admitted plan determining output order and expected identities. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Completion claims; first exact-id match precedes last same-slot fallback. */
    receipts: readonly IAutoMovieProductionRenderChunkReceipt[];

    /** Ephemeral attempts selected with the same exact-id/fallback precedence. */
    attempts: readonly IAutoMovieProductionRenderAttempt[];
}): IAutoMovieProductionRenderChunkStatus[] {
    return props.plan.chunks.map((chunk: IAutoMovieProductionRenderChunk): IAutoMovieProductionRenderChunkStatus => {
        const slotReceipts: IAutoMovieProductionRenderChunkReceipt[] = props.receipts.filter((item: IAutoMovieProductionRenderChunkReceipt): boolean => item.slot === chunk.slot);
        const receipt: IAutoMovieProductionRenderChunkReceipt | undefined = slotReceipts.find((item: IAutoMovieProductionRenderChunkReceipt): boolean => item.chunk === chunk.id) ??
            slotReceipts.at(-1);
        const slotAttempts: IAutoMovieProductionRenderAttempt[] = props.attempts.filter((item: IAutoMovieProductionRenderAttempt): boolean => item.slot === chunk.slot);
        const attempt: IAutoMovieProductionRenderAttempt | undefined = slotAttempts.find((item: IAutoMovieProductionRenderAttempt): boolean => item.chunk === chunk.id) ??
            slotAttempts.at(-1);
        if (receipt?.chunk === chunk.id) {
            try {
                verifyProductionRenderChunkReceipt({
                    plan: props.plan,
                    chunk,
                    receipt,
                });
                return productionRenderJobChunkStatus(chunk, "complete", "Verify current bytes, then reuse this chunk.");
            }
            catch (error) {
                // Receipt verification throws nothing but Error refusals.
                return productionRenderJobChunkStatus(chunk, "failed", `${(error as Error).message} Rerender this chunk.`);
            }
        }
        if (attempt?.chunk === chunk.id)
            return productionRenderJobChunkStatus(chunk, attempt.state, attempt.state === "running"
                ? "Wait for its lock owner or recover the abandoned attempt."
                : attempt.correction);
        if (receipt !== undefined || attempt !== undefined)
            return productionRenderJobChunkStatus(chunk, "stale", "Quarantine prior slot output and render only this current chunk.");
        return productionRenderJobChunkStatus(chunk, "planned", "Acquire its lock, render, encode, verify, and commit.");
    });
}
