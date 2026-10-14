import { type IAutoMovieProductionRenderFrame, type IAutoMovieProductionRenderLayer, SHA256_DIGEST_PATTERN, productionRenderLayersForPass } from "@automovie/engine";
import { IAutoMovieSemanticMaskReceipt } from "@automovie/interface";
import { type IAutoMovieProductionRenderChunk, type IAutoMovieProductionRenderJobPlan } from "@automovie/render";

import type { IAutoMovieProductionRenderedFrameReceipt } from "./IAutoMovieProductionRenderedFrameReceipt";
import type { IAutoMovieProductionRenderChunkReceipt } from "./IAutoMovieProductionRenderChunkReceipt";
import { productionRenderJobValidSemanticPath } from "./productionRenderJobValidSemanticPath";
import { productionRenderJobValidByteFact } from "./productionRenderJobValidByteFact";

/**
 * Check supplied chunk receipt identity, frame coverage, raster and semantic-layer claims.
 *
 * @evidence contracts/common.md#principled-implementation Exact version/slot/id, positional frame count/global indices/raster, positive safe byte facts and mask-layer population are compared in order. Plan/receipt schemas are caller premises; payload bytes are never read here.
 * @evidence contracts/common.md#clear-and-simple-design One completion-fact check serves status and scheduler; semantic receipt creation and actual media/ownership verification remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Historical versions and missing/foreign/incomplete mask claims refuse; admitted digests and counts alone do not prove encoded media or resident byte agreement.
 * @evidence contracts/common.md#meaningful-documentation Defines half-open planned frame coverage, per-layer semantic order and the absence of media probing/path ownership admission.
 * @evidence contracts/performance.md#efficient-algorithms Visits F frames and L scheduled mask layers, builds L expected semantic pairs and checks supplied receipts; unresolved arrays are also traversed before the required-empty refusal.
 * @evidence contracts/performance.md#reuse-equivalent-work One expected semantic population supplies both length and positional comparison; no serialized receipt or completed-byte verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Expected pair arrays are call-local and input records remain borrowed; no payload buffers, native descriptors or tasks are acquired.
 */
export function verifyProductionRenderChunkReceipt(props: {
    /** Borrowed current plan supplying raster and pass/frame requirements. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Planned chunk whose identity and ordered frames must match the receipt. */
    chunk: IAutoMovieProductionRenderChunk;

    /** Supplied typed receipt claims; referenced payloads are not read here. */
    receipt: IAutoMovieProductionRenderChunkReceipt;
}): void {
    const { plan, chunk, receipt }: {
        plan: IAutoMovieProductionRenderJobPlan;
        chunk: IAutoMovieProductionRenderChunk;
        receipt: IAutoMovieProductionRenderChunkReceipt;
    } = props;
    if (receipt.version !== 2 ||
        receipt.slot !== chunk.slot ||
        receipt.chunk !== chunk.id)
        throw new Error(`Chunk receipt "${receipt.slot}" is stale.`);
    if (receipt.frames.length !== chunk.frames.length)
        throw new Error(`Chunk "${chunk.slot}" has ${receipt.frames.length} frame receipts; expected ${chunk.frames.length}.`);
    receipt.frames.forEach((frameReceipt: IAutoMovieProductionRenderedFrameReceipt, index: number): void => {
        const expected: number = chunk.frames[index]!.globalFrame;
        if (frameReceipt.globalFrame !== expected ||
            frameReceipt.width !== plan.frameFormat.width ||
            frameReceipt.height !== plan.frameFormat.height ||
            productionRenderJobValidByteFact(frameReceipt) === false)
            throw new Error(`Chunk "${chunk.slot}" frame ${index} does not prove global frame ${expected} at the production raster.`);
    });
    if (productionRenderJobValidByteFact(receipt.encoded) === false)
        throw new Error(`Chunk "${chunk.slot}" has no verified encoded output.`);
    const expectedSemantic: {
        frame: number;
        shot: string;
    }[] = chunk.pass === "mask"
        ? chunk.frames.flatMap((frame: IAutoMovieProductionRenderFrame): {
            frame: number;
            shot: string;
        }[] => productionRenderLayersForPass(frame, chunk.pass).map((layer: Omit<IAutoMovieProductionRenderLayer, "weight"> & {
            weight: number;
        }): {
            frame: number;
            shot: string;
        } => ({
            frame: frame.globalFrame,
            shot: layer.shot,
        })))
        : [];
    if (receipt.semanticMasks.length !== expectedSemantic.length)
        throw new Error(`Chunk "${chunk.slot}" has ${receipt.semanticMasks.length} semantic records; expected ${expectedSemantic.length}.`);
    receipt.semanticMasks.forEach((semantic: IAutoMovieSemanticMaskReceipt, index: number): void => {
        const expected: {
            frame: number;
            shot: string;
        } = expectedSemantic[index]!;
        if (semantic.version !== 1 ||
            semantic.pass !== "mask" ||
            semantic.frame !== expected.frame ||
            semantic.shot !== expected.shot ||
            productionRenderJobValidByteFact(semantic.sidecar) === false ||
            productionRenderJobValidSemanticPath(semantic.sidecar.path) === false ||
            SHA256_DIGEST_PATTERN.test(semantic.semanticDigest) === false ||
            semantic.coverage.unresolved.some((id: string, unresolvedIndex: number): boolean => id.trim().length === 0 ||
                (unresolvedIndex !== 0 &&
                    semantic.coverage.unresolved[unresolvedIndex - 1]! >= id)) ||
            semantic.coverage.unresolved.length !== 0 ||
            Number.isSafeInteger(semantic.coverage.unaddressed) === false ||
            semantic.coverage.unaddressed !== 0)
            throw new Error(`Chunk "${chunk.slot}" semantic record ${index} is missing, foreign, incomplete, or invalid.`);
    });
}
