import { type IAutoMovieProductionRenderChunk } from "@automovie/render";
import type { IAutoMovieProductionRenderChunkStatus } from "./IAutoMovieProductionRenderChunkStatus";

/**
 * Project a planned chunk identity and chosen classification into one status row.
 *
 * @evidence contracts/common.md#principled-implementation Copies slot/id with the caller's already selected state/correction; this projection performs no independent currentness or byte admission.
 * @evidence contracts/common.md#clear-and-simple-design One row constructor serves all status branches without another status registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither path/slot equality nor a row's wording proves resident bytes or successful host execution.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed planning identity and caller-owned classification/message provenance.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one fixed-shape row and borrows strings; no frame or record population is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the existing selected state rather than repeating receipt validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned row transfers to the result array, with no descriptor, buffer inventory or task.
 */
export function productionRenderJobChunkStatus(chunk: IAutoMovieProductionRenderChunk, state: IAutoMovieProductionRenderChunkStatus["status"], correction: string): IAutoMovieProductionRenderChunkStatus {
    return ({
        slot: chunk.slot,
        chunk: chunk.id,
        status: state,
        correction,
    });
}
