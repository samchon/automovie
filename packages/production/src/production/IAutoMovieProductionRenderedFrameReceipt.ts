

/**
 * One supplied frame's global index, path, digest, byte count and raster claims.
 *
 * @evidence contracts/common.md#principled-implementation The completion validator compares ordered global frame/raster and byte-fact syntax; host payload admission remains external.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Frame records transfer with chunk receipts and can scale with the scheduled frame population.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderedFrameReceipt {
    /**
     * Exact zero-based film frame.
     */
    globalFrame: number;

    /**
     * Chunk-directory-relative PNG path.
     */
    path: string;

    /**
     * Digest of the resident PNG bytes.
     */
    digest: string;

    /**
     * Positive resident PNG byte count.
     */
    bytes: number;

    /**
     * Decoded PNG width.
     */
    width: number;

    /**
     * Decoded PNG height.
     */
    height: number;
}
