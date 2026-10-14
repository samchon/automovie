

/**
 * A presence envelope retaining an arbitrary thrown chunk lifecycle value.
 *
 * @evidence contracts/common.md#principled-implementation Undefined envelope means no phase failure; error:undefined remains a present thrown value preserved by the aggregate helper.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Selected fatal state retains its cause until propagation; arbitrary cause graphs have no fixed bound.
 * @author Samchon
 */
export interface IProductionRenderChunkFailure {
    /** Original thrown value, including undefined, retained as a present failure. */
    error: unknown;
}
