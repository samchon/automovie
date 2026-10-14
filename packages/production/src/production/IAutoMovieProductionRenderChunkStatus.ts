

/**
 * One plan-ordered chunk classification and its next-action text.
 *
 * @evidence contracts/common.md#principled-implementation The status projector keeps current planning identity separate from complete/running/stale/failed/planned advice.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Result rows are caller-owned and scale with planned chunk count; they acquire no lock or worker.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderChunkStatus {
    /**
     * Stable operational slot.
     */
    slot: string;

    /**
     * Current planned content identity.
     */
    chunk: string;

    /**
     * Current completion/recovery classification.
     */
    status: "planned" | "running" | "complete" | "stale" | "failed";

    /**
     * Exact next action for this state.
     */
    correction: string;
}
