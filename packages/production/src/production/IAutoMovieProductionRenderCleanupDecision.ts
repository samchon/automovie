import type { IAutoMovieProductionRenderGcCandidate } from "./IAutoMovieProductionRenderGcCandidate";
import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";
import type { AutoMovieProductionRenderCleanupAuthority } from "./AutoMovieProductionRenderCleanupAuthority";
import type { AutoMovieProductionRenderArtifactStage } from "./AutoMovieProductionRenderArtifactStage";
import type { IAutoMovieProductionRenderCleanupReceipt } from "./IAutoMovieProductionRenderCleanupReceipt";

/**
 * One normalized candidate's disposition facts and basis-bound receipt.
 *
 * @evidence contracts/common.md#principled-implementation The planner partitions candidates and repeats decision facts into receipts under one canonical basis; the shape alone executes no physical apply.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Results retain normalized candidate/receipt records and borrowed observation references until the caller releases the plan.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderCleanupDecision {
    /** Exact inventory candidate being adjudicated. */
    candidate: IAutoMovieProductionRenderGcCandidate;

    /** State carried from inspection or reference classification. */
    state: AutoMovieProductionRenderArtifactState;

    /** Mutation authority retained by this decision. */
    authority: AutoMovieProductionRenderCleanupAuthority;

    /** Boundary responsible for the decision. */
    stage: AutoMovieProductionRenderArtifactStage;

    /** Sanitized reason for the selected disposition. */
    reason: string;

    /** Caller-owned receipt bound to one complete plan basis; it is not frozen. */
    receipt: IAutoMovieProductionRenderCleanupReceipt;
}
