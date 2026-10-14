import type { IAutoMovieProductionRenderCleanupDecision } from "./IAutoMovieProductionRenderCleanupDecision";

/**
 * Internal cleanup decision fields before the canonical basis is known.
 *
 * @evidence contracts/common.md#principled-implementation Omit removes only receipt so the pure planner can derive the complete ordered basis before repeating it into every receipt.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Decision arrays remain local until receipt binding; the type coordinates no cache or native resource.
 */
export type IUnreceiptedRenderCleanupDecision = Omit<IAutoMovieProductionRenderCleanupDecision, "receipt">;
