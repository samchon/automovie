import type { IAutoMovieProductionRenderGcCandidate } from "./IAutoMovieProductionRenderGcCandidate";
import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";
import type { AutoMovieProductionRenderCleanupAuthority } from "./AutoMovieProductionRenderCleanupAuthority";
import type { AutoMovieProductionRenderArtifactStage } from "./AutoMovieProductionRenderArtifactStage";

/**
 * Self-contained plan basis, disposition and captured candidate/finding claims for a cleanup decision.
 *
 * @evidence contracts/common.md#principled-implementation The planner copies these fields from one decision, allowing later records to retain its meaning without trusting a digest alone as mutation authorization.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Receipts are caller-owned plain records; no original file bytes, descriptors or tasks are acquired by the type.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderCleanupReceipt {
    /** Receipt schema. */
    version: 1;

    /** The plan basis this decision was computed under. */
    basis: string;

    /** The disposition set the decision was placed in. */
    disposition: "retain" | "remove" | "quarantine" | "manual-adjudication";

    /** Ownership class of the adjudicated candidate. */
    kind: IAutoMovieProductionRenderGcCandidate["kind"];

    /** Canonical logical path of the adjudicated candidate. */
    path: string;

    /** Physical generation the decision was made against, or null. */
    generation: string | null;

    /** Content identity the decision was made against, or null. */
    fingerprint: string | null;

    /** Artifact state that selected the disposition. */
    state: AutoMovieProductionRenderArtifactState;

    /** Claimed mutation authority carried from the host or reference classification. */
    authority: AutoMovieProductionRenderCleanupAuthority;

    /** Boundary that produced the state. */
    stage: AutoMovieProductionRenderArtifactStage;

    /** Sanitized reason repeated from the decision. */
    reason: string;
}
