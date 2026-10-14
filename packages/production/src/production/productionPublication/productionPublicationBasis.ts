import type { IAutoMovieProductionRenderChunk, IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { IAutoMovieProductionPublicationIdentity } from "@automovie/interface";

import type { IProductionPublicationBasis } from "./IProductionPublicationBasis";
import { productionPublicationDigestValue } from "./productionPublicationDigestValue";

/**
 * Project one supplied render plan into publication identity fields before fingerprinting.
 *
 * @evidence contracts/common.md#principled-implementation Clones runtime/tier/formats, copies chunk metadata and hashes each complete frame mapping plus all four track populations; the plan is a caller-admitted current input.
 * @evidence contracts/common.md#clear-and-simple-design One basis producer feeds both new identity construction and current-publication comparison.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection performs no independent plan admission, capture observation or media acquisition, and content hashes do not prove the plan's host premises.
 * @evidence contracts/common.md#meaningful-documentation Defines protocol epoch, copied nested metadata and complete frame/track digest coverage; plan arrays are traversed in their supplied order.
 * @evidence contracts/performance.md#efficient-algorithms Cloning scales with copied nested metadata; each complete chunk-frame/track population is canonicalized and hashed, including key ordering and temporary encoded bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the plan's acquired identities and shared digest operation, without caching a basis for a mutable plan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned basis owns cloned runtime/tier/format objects and copied chunk records; temporary canonical buffers expire and no native handle is acquired.
 */
export const productionPublicationBasis: (plan: IAutoMovieProductionRenderJobPlan) => IProductionPublicationBasis = (plan: IAutoMovieProductionRenderJobPlan): IProductionPublicationBasis => ({
    protocolVersion: "automovie.production-publication.v4",
    planVersion: plan.version,
    productionId: plan.productionId,
    compileFingerprint: plan.compileFingerprint,
    editFingerprint: plan.editFingerprint,
    runtimeIdentity: structuredClone(plan.runtimeIdentity),
    tier: structuredClone(plan.tier),
    sourceFrameFormat: structuredClone(plan.sourceFrameFormat),
    frameFormat: structuredClone(plan.frameFormat),
    totalFrames: plan.totalFrames,
    chunkFrames: plan.chunkFrames,
    chunks: plan.chunks.map((chunk: IAutoMovieProductionRenderChunk): IAutoMovieProductionPublicationIdentity["chunks"][number] => ({
        slot: chunk.slot,
        id: chunk.id,
        deliverable: chunk.deliverable,
        kind: chunk.kind,
        pass: chunk.pass,
        frameStart: chunk.frameStart,
        frameEndExclusive: chunk.frameEndExclusive,
        frames: productionPublicationDigestValue(chunk.frames),
    })),
    tracks: {
        captions: productionPublicationDigestValue(plan.tracks.captions),
        audio: productionPublicationDigestValue(plan.tracks.audio),
        audioAssets: productionPublicationDigestValue(plan.tracks.audioAssets),
        effects: productionPublicationDigestValue(plan.tracks.effects),
    },
});
