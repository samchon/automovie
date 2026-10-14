import { IAutoMovieSemanticMaskReceipt } from "@automovie/interface";

import type { IAutoMovieProductionRenderedFrameReceipt } from "./IAutoMovieProductionRenderedFrameReceipt";

/**
 * Content-only chunk completion claims, excluding attempt/PID state.
 *
 * @evidence contracts/common.md#principled-implementation Version/slot/chunk, ordered frame facts, semantic layers and encoded byte facts remain distinct fields checked by completion admission.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Frame and semantic arrays can retain full scheduled populations; the structure itself acquires no payload or descriptor.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderChunkReceipt {
    /**
     * Receipt schema.
     */
    version: 2;

    /**
     * Stable operational slot.
     */
    slot: string;

    /**
     * Exact current chunk content id.
     */
    chunk: string;

    /**
     * Ordered byte facts for the full frame range.
     */
    frames: IAutoMovieProductionRenderedFrameReceipt[];

    /** Complete semantic dependencies for every shot layer of a mask frame. */
    semanticMasks: IAutoMovieSemanticMaskReceipt[];

    /**
     * Claimed chunk MP4 facts. Completion admission checks this record's shape;
     * the encoder host must separately verify the referenced resident media.
     */
    encoded: {
        /** Chunk-directory-relative MP4 path. */
        path: string;

        /** Digest of the resident MP4 bytes. */
        digest: string;

        /** Positive resident MP4 byte count. */
        bytes: number;
    };
}
