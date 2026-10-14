

/**
 * Ephemeral running/failed attempt state and correction for one operational slot.
 *
 * @evidence contracts/common.md#principled-implementation Status classification compares its chunk id separately from durable completion receipt claims.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callers retain attempt strings until status/storage release; the record owns no running worker by itself.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderAttempt {
    /**
     * Stable operational slot.
     */
    slot: string;

    /**
     * Chunk identity attempted by the process.
     */
    chunk: string;

    /**
     * Non-content attempt state.
     */
    state: "running" | "failed";

    /**
     * Exact recovery action or failure message.
     */
    correction: string;
}
