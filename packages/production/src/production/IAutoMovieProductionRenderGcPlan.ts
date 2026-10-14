import type { IAutoMovieProductionRenderCleanupDecision } from "./IAutoMovieProductionRenderCleanupDecision";

/**
 * Four reasoned dry-run partitions and a safe removable-byte sum under one canonical basis.
 *
 * @evidence contracts/common.md#principled-implementation The planner produces version four and basis-bound receipts; a host must separately prove current exact-generation authority before applying any decision.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Complete partitions and nested candidate/receipt claims remain caller-owned without a fixed population cap; the type owns no physical sweep.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderGcPlan {
    /**
     * GC plan schema.
     */
    version: 4;

    /**
     * Digest over the current plans, every retention input, and every decision
     * in canonical order. Two inventories that classify the same population the
     * same way share a basis whatever order they were collected in, and an apply
     * must present the basis of the dry-run it is executing.
     */
    basis: string;

    /**
     * Entries marked current by the supplied references, or observed absent.
     */
    retain: IAutoMovieProductionRenderCleanupDecision[];

    /**
     * Exact-generation entries classified verified-stale with removal authority.
     * Physical apply must separately reauthenticate these host-supplied claims.
     */
    remove: IAutoMovieProductionRenderCleanupDecision[];

    /**
     * Exact-generation integrity-failed entries with claimed quarantine authority.
     * This dry-run does not physically move them or prove host capture.
     */
    quarantine: IAutoMovieProductionRenderCleanupDecision[];

    /**
     * Unresolved generations retained for an operator because no move is proved.
     */
    manualAdjudication: IAutoMovieProductionRenderCleanupDecision[];

    /**
     * Safe integer sum of byte-count claims in the remove partition.
     */
    reclaimableBytes: number;
}
